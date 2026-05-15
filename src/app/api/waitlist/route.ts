import { type NextRequest, NextResponse } from "next/server";

import {
  ANONYMOUS_SESSION_COOKIE_NAME,
  isValidAnonymousSessionId,
} from "@/lib/anonymous-session";
import { RateLimitExceededError } from "@/lib/rate-limit/assert-check-submission-allowed";
import { assertWaitlistAllowed } from "@/lib/rate-limit/assert-waitlist-allowed";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";
import {
  WAITLIST_SOURCES,
  type WaitlistSource,
} from "@/lib/waitlist/constants";
import { subscribeWaitlist } from "@/lib/waitlist/subscribe-waitlist";
import { validateEmail } from "@/lib/waitlist/validate-email";

function isWaitlistSource(value: string): value is WaitlistSource {
  return (WAITLIST_SOURCES as readonly string[]).includes(value);
}

/**
 * §2.8 — Server-only waitlist signup (admin insert, email hash dedupe).
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const emailRaw = typeof record.email === "string" ? record.email : "";
  const sourceRaw = typeof record.source === "string" ? record.source : "";
  const marketingConsent = record.marketing_consent === true;
  const claimId =
    typeof record.claim_id === "string" ? record.claim_id : undefined;

  if (!isWaitlistSource(sourceRaw)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  const validated = validateEmail(emailRaw);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const sessionRaw = request.cookies.get(ANONYMOUS_SESSION_COOKIE_NAME)?.value;
  const anonymousSessionId = isValidAnonymousSessionId(sessionRaw)
    ? sessionRaw
    : null;

  try {
    const admin = createAdminClient();
    await assertWaitlistAllowed(admin, request);

    const result = await subscribeWaitlist(admin, {
      email: validated.email,
      source: sourceRaw,
      marketingConsent,
      anonymousSessionId,
      claimId: claimId ?? null,
    });

    return NextResponse.json({
      ok: true,
      status: result.status,
    });
  } catch (e) {
    if (e instanceof RateLimitExceededError) {
      return NextResponse.json(
        {
          error: e.userMessage,
          retry_after_seconds: e.retryAfterSeconds,
        },
        { status: 429 },
      );
    }
    if (e instanceof SupabaseAdminKeyMissingError) {
      return NextResponse.json(
        { error: "Waitlist API is not configured on this host" },
        { status: 503 },
      );
    }
    console.error("POST /api/waitlist", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
