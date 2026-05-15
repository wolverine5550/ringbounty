import { type NextRequest, NextResponse } from "next/server";

import {
  ANONYMOUS_SESSION_COOKIE_NAME,
  isValidAnonymousSessionId,
} from "@/lib/anonymous-session";
import { createOrGetActiveClaimForSession } from "@/lib/claims/create-or-get-active-claim-for-session";
import { loadAnonymousDraftGateStatus } from "@/lib/claims/load-claim-query-snapshot";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";

/**
 * §2.5 — Returns anonymous draft gate state for the account wall UI.
 * No PII in the response; only claim id and boolean flags.
 */
export async function GET(request: NextRequest) {
  const raw = request.cookies.get(ANONYMOUS_SESSION_COOKIE_NAME)?.value;
  if (!isValidAnonymousSessionId(raw)) {
    return NextResponse.json(
      {
        claim_id: null,
        is_successful_query: false,
        requires_account_wall: false,
      },
      { status: 200 },
    );
  }

  try {
    const admin = createAdminClient();
    await createOrGetActiveClaimForSession(admin, raw);
    const gate = await loadAnonymousDraftGateStatus(admin, raw);

    if (!gate) {
      return NextResponse.json({
        claim_id: null,
        is_successful_query: false,
        requires_account_wall: false,
      });
    }

    return NextResponse.json({
      claim_id: gate.claimId,
      is_successful_query: gate.isSuccessfulQuery,
      requires_account_wall: gate.requiresAccountWall,
    });
  } catch (e) {
    if (e instanceof SupabaseAdminKeyMissingError) {
      return NextResponse.json(
        { error: "Anonymous claim API is not configured on this host" },
        { status: 503 },
      );
    }
    console.error("GET /api/claims/anonymous/status", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
