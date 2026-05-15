import { type NextRequest, NextResponse } from "next/server";

import {
  ANONYMOUS_SESSION_COOKIE_NAME,
  isValidAnonymousSessionId,
} from "@/lib/anonymous-session";
import {
  assertCheckSubmissionAllowed,
  RateLimitExceededError,
} from "@/lib/rate-limit/assert-check-submission-allowed";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";

/**
 * §2.7 — Rate-limited check submission endpoint. Phase 4 will run the full pipeline here;
 * for now it records an allowed submission after enforcing hourly limits.
 */
export async function POST(request: NextRequest) {
  const raw = request.cookies.get(ANONYMOUS_SESSION_COOKIE_NAME)?.value;
  if (!isValidAnonymousSessionId(raw)) {
    return NextResponse.json(
      { error: "Missing or invalid anonymous session" },
      { status: 401 },
    );
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
