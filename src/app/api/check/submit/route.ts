import { type NextRequest, NextResponse } from "next/server";

import {
  ANONYMOUS_SESSION_COOKIE_NAME,
  isValidAnonymousSessionId,
} from "@/lib/anonymous-session";
import { CHECK_MAX_PHONE_ROWS } from "@/lib/check/constants";
import {
  parseAndDedupePhoneNumberPayload,
  type DedupedPhoneEntry,
} from "@/lib/check/us-phone";
import { createOrGetActiveClaimForSession } from "@/lib/claims/create-or-get-active-claim-for-session";
import {
  assertCheckSubmissionAllowed,
  RateLimitExceededError,
} from "@/lib/rate-limit/assert-check-submission-allowed";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

type PhonePayloadError = Extract<
  ReturnType<typeof parseAndDedupePhoneNumberPayload>,
  { ok: false }
>["error"];

function jsonErrorForPhoneParse(error: PhonePayloadError): NextResponse {
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
          error: `You can submit at most ${String(CHECK_MAX_PHONE_ROWS)} phone numbers per check.`,
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
): Promise<{ claimId: string }> {
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
    return { claimId };
  }
  const { error: insertError } = await admin.from("claim_subjects").insert(
    entries.map((e) => ({
      claim_id: claimId,
      phone_number: e.phoneNumberDisplay,
      phone_number_normalized: e.phoneNumberNormalized,
    })),
  );
  if (insertError) {
    throw insertError;
  }
  return { claimId };
}

/**
 * §2.7 — Rate-limited check submission endpoint.
 *
 * Optional JSON body:
 * `{ "phone_numbers": […], "phone_displays"?: […] }` — each number parsed to **E.164**
 * (`+1` + 10 digits) with NANP checks; duplicates rejected. When `phone_displays` is
 * sent it must align row-for-row (`null`/`""` ⇒ store `phone_number` null). Persisted via
 * service role to `claim_subjects` (task_manager §4.4–4.5 bridge).
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
        CHECK_MAX_PHONE_ROWS,
        displayInputs,
      );
      if (!parsed.ok) {
        return jsonErrorForPhoneParse(parsed.error);
      }
      phonePayload = parsed.entries;
    }
  }

  try {
    const admin = createAdminClient();
    await assertCheckSubmissionAllowed(admin, request, raw);

    let claimId: string | undefined;
    if (phonePayload && phonePayload.length > 0) {
      ({ claimId } = await replaceClaimSubjectsForPhones(
        admin,
        raw,
        phonePayload,
      ));
    }

    return NextResponse.json({
      ok: true,
      message:
        "Check submission recorded. Full provider pipeline completes in Phase 5.",
      ...(claimId ? { claim_id: claimId } : {}),
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
    console.error("POST /api/check/submit", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
