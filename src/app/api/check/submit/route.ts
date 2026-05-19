import { type NextRequest, NextResponse } from "next/server";

import {
  ANONYMOUS_SESSION_COOKIE_NAME,
  isValidAnonymousSessionId,
} from "@/lib/anonymous-session";
import {
  CHECK_FREE_LOOKUP_MAX_PHONES,
  CHECK_MAX_PHONE_ROWS,
} from "@/lib/check/constants";
import { createClaimWithSubjectsForAuthenticatedUser } from "@/lib/claims/create-claim-for-authenticated-check";
import { loadAnonymousDraftGateStatus } from "@/lib/claims/load-claim-query-snapshot";
import { getFederalDncCheckSummaryForClient } from "@/lib/dnc/federal-dnc-access";
import { getStateDncCheckSummaryForAnonymousCheck } from "@/lib/dnc/state-dnc-access";
import { runSpamChecksForPhoneList } from "@/lib/spam/spam-check-pipeline";
import {
  parseAndDedupePhoneNumberPayload,
  type DedupedPhoneEntry,
} from "@/lib/check/us-phone";
import { createOrGetActiveClaimForSession } from "@/lib/claims/create-or-get-active-claim-for-session";
import {
  assertCheckSubmissionAllowed,
  RateLimitExceededError,
} from "@/lib/rate-limit/assert-check-submission-allowed";
import { getClientIp } from "@/lib/rate-limit/get-client-ip";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

type PhonePayloadError = Extract<
  ReturnType<typeof parseAndDedupePhoneNumberPayload>,
  { ok: false }
>["error"];

function jsonErrorForPhoneParse(
  error: PhonePayloadError,
  maxPhones: number,
): NextResponse {
  const status = 400;
  switch (error) {
    case "invalid_body":
      return NextResponse.json(
        {
          error:
            "`phone_numbers` must be an array of strings. Optional `phone_displays` must be an aligned array.",
        },
        { status },
      );
    case "too_many":
      return NextResponse.json(
        {
          error:
            maxPhones === CHECK_FREE_LOOKUP_MAX_PHONES
              ? `You can submit at most ${String(maxPhones)} phone number per free check.`
              : `You can submit at most ${String(maxPhones)} phone numbers per check.`,
        },
        { status },
      );
    case "invalid_entry":
      return NextResponse.json(
        {
          error:
            "Each entry must be a complete, valid U.S. phone number (10 digits plus optional leading 1; standard area/exchange rules).",
        },
        { status },
      );
    case "duplicates":
      return NextResponse.json(
        { error: "The same number was included more than once." },
        { status },
      );
    case "display_length_mismatch":
      return NextResponse.json(
        {
          error:
            "`phone_displays`, when sent, must have the same length as `phone_numbers`.",
        },
        { status },
      );
    case "invalid_display_entry":
      return NextResponse.json(
        {
          error:
            "Each `phone_displays` item must be a string or null when provided.",
        },
        { status },
      );
    default:
      return NextResponse.json({ error: "Invalid phone numbers." }, { status });
  }
}

async function replaceClaimSubjectsForPhones(
  admin: SupabaseClient<Database>,
  anonymousSessionId: string,
  entries: DedupedPhoneEntry[],
): Promise<{ claimId: string; subjectIds: string[] }> {
  const { claimId } = await createOrGetActiveClaimForSession(
    admin,
    anonymousSessionId,
  );
  const { error: deleteError } = await admin
    .from("claim_subjects")
    .delete()
    .eq("claim_id", claimId);
  if (deleteError) {
    throw deleteError;
  }
  if (entries.length === 0) {
    return { claimId, subjectIds: [] };
  }
  const { data: inserted, error: insertError } = await admin
    .from("claim_subjects")
    .insert(
      entries.map((e) => ({
        claim_id: claimId,
        phone_number: e.phoneNumberDisplay,
        phone_number_normalized: e.phoneNumberNormalized,
      })),
    )
    .select("id");
  if (insertError) {
    throw insertError;
  }
  const subjectIds =
    inserted?.map((row) => row.id).filter((id): id is string => !!id) ?? [];
  if (subjectIds.length !== entries.length) {
    throw new Error("claim_subjects insert row count mismatch");
  }
  if (entries.length > 0) {
    const { error: statusError } = await admin
      .from("claims")
      .update({ status: "checking" })
      .eq("id", claimId);
    if (statusError) {
      throw statusError;
    }
  }
  return { claimId, subjectIds };
}

/**
 * §2.7 — Rate-limited check submission endpoint.
 *
 * Optional JSON body:
 * `{ "phone_numbers": […], "phone_displays"?: […] }` — each number parsed to **E.164**
 * (`+1` + 10 digits) with NANP checks; duplicates rejected. When `phone_displays` is
 * sent it must align row-for-row (`null`/`""` ⇒ store `phone_number` null). Persisted via
 * service role to `claim_subjects` (task_manager §4.5). The parent **`claims` row** advances
 * **`draft` → `checking`** when at least one subject row is written (migration
 * `supabase/migrations/20260515160000_claims_status_checking.sql`).
 *
 * Successful body write returns **`claim_id`** and **`claim_subject_ids`**; for a single
 * `INSERT … VALUES (row1), (row2), … RETURNING id`, PostgreSQL returns ids in the same
 * order as the listed rows (matches `phone_numbers`). Use these for `/results`, `/summary`,
 * and `/qualify/[id]?claim=…` when the product wires client navigation.
 *
 * §4.6 / §5.4 — After persistence, Nomorobo + Twilio spam checks run **in parallel per number**
 * (`Promise.allSettled`); outcomes persist to `claim_subjects` + `claim_events`. Provider HTTP
 * is skipped when env flags/keys are off. Failures attach `error_code` and are logged server-side.
 * Response may include **`number_checks`** with per-provider outcomes (partial failure is
 * still HTTP 200 when persistence succeeded).
 *
 * Empty POST body keeps the outcome-panel preview submit behavior.
 */
export async function POST(request: NextRequest) {
  const raw = request.cookies.get(ANONYMOUS_SESSION_COOKIE_NAME)?.value;
  if (!isValidAnonymousSessionId(raw)) {
    return NextResponse.json(
      { error: "Missing or invalid anonymous session" },
      { status: 401 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const authenticatedUserId = user?.id ?? null;
  const maxPhones = authenticatedUserId
    ? CHECK_MAX_PHONE_ROWS
    : CHECK_FREE_LOOKUP_MAX_PHONES;

  let phonePayload: DedupedPhoneEntry[] | null = null;

  const text = await request.text();
  if (text.trim()) {
    let body: unknown;
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }
    if (body !== null && typeof body === "object" && "phone_numbers" in body) {
      const rawList = (body as { phone_numbers: unknown }).phone_numbers;
      if (!Array.isArray(rawList)) {
        return NextResponse.json(
          { error: "`phone_numbers` must be an array." },
          { status: 400 },
        );
      }
      if (rawList.length === 0) {
        return NextResponse.json(
          { error: "Enter at least one phone number." },
          { status: 400 },
        );
      }

      let displayInputs: unknown;
      if (
        typeof body === "object" &&
        body !== null &&
        "phone_displays" in body
      ) {
        displayInputs = (body as { phone_displays: unknown }).phone_displays;
      }

      const parsed = parseAndDedupePhoneNumberPayload(
        rawList,
        maxPhones,
        displayInputs,
      );
      if (!parsed.ok) {
        return jsonErrorForPhoneParse(parsed.error, maxPhones);
      }
      phonePayload = parsed.entries;
    }
  }

  try {
    const admin = createAdminClient();
    await assertCheckSubmissionAllowed(admin, request, raw);

    if (!authenticatedUserId && phonePayload && phonePayload.length > 0) {
      const existingGate = await loadAnonymousDraftGateStatus(admin, raw);
      if (existingGate && existingGate.snapshot.subjects.length > 0) {
        return NextResponse.json(
          {
            error:
              "You've used your free check. Sign in to continue or run another check after creating an account.",
          },
          { status: 403 },
        );
      }
    }

    let userStateCode: string | null = null;
    if (authenticatedUserId) {
      const { data: profile } = await admin
        .from("users")
        .select("state")
        .eq("id", authenticatedUserId)
        .maybeSingle();
      userStateCode = profile?.state ?? null;
    }

    let claimId: string | undefined;
    let claimSubjectIds: string[] | undefined;
    let numberChecks: Awaited<ReturnType<typeof runSpamChecksForPhoneList>> | undefined;
    if (phonePayload && phonePayload.length > 0) {
      const persisted = authenticatedUserId
        ? await createClaimWithSubjectsForAuthenticatedUser(
            admin,
            authenticatedUserId,
            phonePayload,
          )
        : await replaceClaimSubjectsForPhones(admin, raw, phonePayload);
      claimId = persisted.claimId;
      claimSubjectIds = persisted.subjectIds;
      numberChecks = await runSpamChecksForPhoneList(admin, {
        claimId: persisted.claimId,
        phones: phonePayload.map((e, i) => ({
          phoneNumberNormalized: e.phoneNumberNormalized,
          subjectId: persisted.subjectIds[i] ?? null,
        })),
        userStateCode,
        anonymousSessionId: authenticatedUserId ? null : raw,
        clientIp: getClientIp(request),
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Check submission recorded.",
      ...(claimId ? { claim_id: claimId } : {}),
      ...(claimSubjectIds !== undefined && claimSubjectIds.length > 0
        ? { claim_subject_ids: claimSubjectIds }
        : {}),
      ...(numberChecks !== undefined && numberChecks.length > 0
        ? {
            number_checks: numberChecks,
            federal_dnc: getFederalDncCheckSummaryForClient(),
            state_dnc: getStateDncCheckSummaryForAnonymousCheck(),
          }
        : {}),
    });
  } catch (e) {
    if (e instanceof RateLimitExceededError) {
      return NextResponse.json(
        {
          error: e.userMessage,
          retry_after_seconds: e.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(e.retryAfterSeconds),
          },
        },
      );
    }
    if (e instanceof SupabaseAdminKeyMissingError) {
      return NextResponse.json(
        { error: "Check API is not configured on this host" },
        { status: 503 },
      );
    }
    console.error(
      JSON.stringify({
        event: "check_submit_unhandled",
        error_code: "INTERNAL_ERROR",
      }),
      e,
    );
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
