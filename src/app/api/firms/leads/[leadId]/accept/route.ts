import { type NextRequest, NextResponse } from "next/server";

import { loadFirmUserMembership } from "@/lib/firms/load-firm-user-membership";
import { createLeadAcceptCheckoutSessionWithDefaultClient } from "@/lib/stripe/connect/create-lead-accept-checkout-session";
import { StripeNotConfiguredError } from "@/lib/stripe/client";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ leadId: string }> };

/**
 * §13.5.1 — Start Stripe Checkout (PaymentIntent) to accept a pool lead.
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

  const { data: visibleLead, error: leadError } = await supabase
    .from("leads")
    .select("id")
    .eq("id", trimmedLeadId)
    .maybeSingle();

  if (leadError) {
    console.error("POST accept lead visibility", leadError);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  if (!visibleLead?.id) {
    return NextResponse.json({ error: "Lead not found or not in your pool" }, { status: 404 });
  }

  const { data: firm } = await supabase
    .from("law_firms")
    .select("name")
    .eq("id", membership.firmId)
    .maybeSingle();

  try {
    const admin = createAdminClient();
    const result = await createLeadAcceptCheckoutSessionWithDefaultClient(admin, {
      leadId: trimmedLeadId,
      firmId: membership.firmId,
      firmName: firm?.name ?? "Your firm",
    });

    return NextResponse.json({
      ok: true,
      checkout_url: result.checkoutUrl,
      session_id: result.sessionId,
      lead_fee_cents: result.leadFeeCents,
    });
  } catch (e) {
    if (e instanceof StripeNotConfiguredError) {
      return NextResponse.json(
        { error: "Stripe is not configured on this host" },
        { status: 503 },
      );
    }
    if (e instanceof SupabaseAdminKeyMissingError) {
      return NextResponse.json(
        { error: "Lead accept API is not configured on this host" },
        { status: 503 },
      );
    }
    if (e instanceof Error) {
      if (e.message === "stripe_connect_not_linked") {
        return NextResponse.json(
          { error: "Complete Stripe Connect setup before accepting leads" },
          { status: 409 },
        );
      }
      if (e.message === "stripe_connect_charges_disabled") {
        return NextResponse.json(
          { error: "Stripe payouts are not enabled for your firm yet" },
          { status: 409 },
        );
      }
      if (e.message === "lead_fee_not_configured") {
        return NextResponse.json(
          { error: "Lead fee is not configured for your firm" },
          { status: 409 },
        );
      }
      if (e.message === "lead_already_taken" || e.message === "lead_not_available") {
        return NextResponse.json({ error: "Lead is no longer available" }, { status: 409 });
      }
    }
    console.error("POST /api/firms/leads/[leadId]/accept", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
