import { type NextRequest, NextResponse } from "next/server";

import {
  ANONYMOUS_SESSION_COOKIE_NAME,
  isValidAnonymousSessionId,
} from "@/lib/anonymous-session";
import { CHECK_MAX_PHONE_ROWS } from "@/lib/check/constants";
import { parseAndDedupePhoneNumberPayload } from "@/lib/check/us-phone";
import {
  assertCheckSubmissionAllowed,
  RateLimitExceededError,
} from "@/lib/rate-limit/assert-check-submission-allowed";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";

type PhonePayloadError = Extract<
  ReturnType<typeof parseAndDedupePhoneNumberPayload>,
  { ok: false }
>["error"];

function jsonErrorForPhoneParse(error: PhonePayloadError): NextResponse {
  const status = 400;
  switch (error) {
    case "invalid_body":
      return NextResponse.json(
        { error: "`phone_numbers` must be an array of strings." },
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
            "Each entry must be a complete U.S. phone number (10 digits, optional leading 1).",
        },
        { status },
      );
    case "duplicates":
      return NextResponse.json(
        { error: "The same number was included more than once." },
        { status },
      );
    default:
      return NextResponse.json({ error: "Invalid phone numbers." }, { status });
  }
}

/**
 * §2.7 — Rate-limited check submission endpoint. Phase 4 will run the full pipeline here;
 * for now it records an allowed submission after enforcing hourly limits.
 *
 * Optional JSON body: `{ "phone_numbers": ["5551234567", …] }` — digits-only or formatted
 * strings; normalized and deduped server-side (task_manager §4.3.3). Empty POST body keeps
 * the legacy “preview submit” used by the outcome panel.
 */
export async function POST(request: NextRequest) {
  const raw = request.cookies.get(ANONYMOUS_SESSION_COOKIE_NAME)?.value;
  if (!isValidAnonymousSessionId(raw)) {
    return NextResponse.json(
      { error: "Missing or invalid anonymous session" },
      { status: 401 },
    );
  }

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
      const parsed = parseAndDedupePhoneNumberPayload(
        rawList,
        CHECK_MAX_PHONE_ROWS,
      );
      if (!parsed.ok) {
        return jsonErrorForPhoneParse(parsed.error);
      }
      void parsed.normalized;
    }
  }

  try {
    const admin = createAdminClient();
    await assertCheckSubmissionAllowed(admin, request, raw);

    return NextResponse.json({
      ok: true,
      message:
        "Check submission recorded. Full number-check pipeline ships in Phase 4.",
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
