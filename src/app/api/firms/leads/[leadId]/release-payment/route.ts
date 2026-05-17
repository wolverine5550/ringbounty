import { type NextRequest, NextResponse } from "next/server";

import { releaseLeadPaymentLock } from "@/lib/firms/release-lead-payment-lock";
import { loadFirmUserMembership } from "@/lib/firms/load-firm-user-membership";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ leadId: string }> };

/**
 * §13.5.1 — Release payment-pending lock when firm cancels Stripe Checkout.
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  const { leadId } = await context.params;
  const trimmedLeadId = leadId?.trim();
  if (!trimmedLeadId) {
    return NextResponse.json({ error: "lead_id is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const membership = await loadFirmUserMembership(supabase, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Firm portal access required" }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const released = await releaseLeadPaymentLock(admin, {
      leadId: trimmedLeadId,
      firmId: membership.firmId,
    });

    return NextResponse.json({ ok: true, released });
  } catch (e) {
    if (e instanceof SupabaseAdminKeyMissingError) {
      return NextResponse.json(
        { error: "Release API is not configured on this host" },
        { status: 503 },
      );
    }
    console.error("POST /api/firms/leads/[leadId]/release-payment", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
