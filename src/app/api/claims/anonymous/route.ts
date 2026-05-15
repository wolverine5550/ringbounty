import { type NextRequest, NextResponse } from "next/server";

import {
  ANONYMOUS_SESSION_COOKIE_NAME,
  isValidAnonymousSessionId,
} from "@/lib/anonymous-session";
import { createOrGetActiveClaimForSession } from "@/lib/claims/create-or-get-active-claim-for-session";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";

/**
 * §2.4 — Server-only anonymous claim bootstrap. Browser never sees the secret / admin key.
 * Expects a valid **HTTP-only** anonymous session cookie (see `proxy.ts` + `/check`).
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
    const { claimId } = await createOrGetActiveClaimForSession(admin, raw);
    return NextResponse.json({ claim_id: claimId });
  } catch (e) {
    if (e instanceof SupabaseAdminKeyMissingError) {
      return NextResponse.json(
        { error: "Anonymous claim API is not configured on this host" },
        { status: 503 },
      );
    }
    console.error("createOrGetActiveClaimForSession", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
