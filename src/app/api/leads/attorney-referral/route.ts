import { type NextRequest, NextResponse } from "next/server";

import { AttorneyReferralNotAllowedError } from "@/lib/claims/can-refer-to-attorney";
import {
  AttorneyReferralConsentRequiredError,
  createAttorneyLead,
} from "@/lib/leads/create-attorney-lead";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Phase 13.1.3 — Create attorney referral `leads` row after consent on `/attorney-connect`.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const claimId = typeof record.claim_id === "string" ? record.claim_id.trim() : "";
  const leadSharingConsent = record.lead_sharing_consent === true;

  if (!claimId) {
    return NextResponse.json({ error: "claim_id is required" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const result = await createAttorneyLead(supabase, admin, {
      claimId,
      userId: user.id,
      userEmail: user.email,
      leadSharingConsent,
    });

    return NextResponse.json({
      ok: true,
      status: result.status,
      lead_id: result.leadId,
    });
  } catch (e) {
    if (e instanceof AttorneyReferralConsentRequiredError) {
      return NextResponse.json(
        { error: "Lead sharing consent is required" },
        { status: 400 },
      );
    }
    if (e instanceof AttorneyReferralNotAllowedError) {
      return NextResponse.json(
        { error: "Attorney referral is not available for this claim", reasons: e.reasons },
        { status: 403 },
      );
    }
    if (e instanceof SupabaseAdminKeyMissingError) {
      return NextResponse.json(
        { error: "Attorney referral API is not configured on this host" },
        { status: 503 },
      );
    }
    console.error("POST /api/leads/attorney-referral", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
