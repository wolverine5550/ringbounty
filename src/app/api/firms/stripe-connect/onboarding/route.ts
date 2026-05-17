import { type NextRequest, NextResponse } from "next/server";

import { loadFirmUserMembership } from "@/lib/firms/load-firm-user-membership";
import { createFirmConnectOnboardingLinkWithDefaultClient } from "@/lib/stripe/connect/create-firm-connect-onboarding-link";
import { StripeNotConfiguredError } from "@/lib/stripe/client";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Phase 13.3.2 — Stripe Connect onboarding link for a linked `firm_users` admin.
 */
export async function POST(_request: NextRequest) {
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
    return NextResponse.json(
      { error: "Firm portal access is not linked to this account" },
      { status: 403 },
    );
  }

  try {
    const admin = createAdminClient();
    const result = await createFirmConnectOnboardingLinkWithDefaultClient(admin, {
      firmId: membership.firmId,
    });

    return NextResponse.json({
      ok: true,
      url: result.url,
      stripe_connect_account_id: result.stripeConnectAccountId,
      expires_at: result.expiresAt,
    });
  } catch (e) {
    if (e instanceof StripeNotConfiguredError) {
      return NextResponse.json(
        { error: "Stripe Connect is not configured on this host" },
        { status: 503 },
      );
    }
    if (e instanceof SupabaseAdminKeyMissingError) {
      return NextResponse.json(
        { error: "Firm onboarding API is not configured on this host" },
        { status: 503 },
      );
    }
    if (e instanceof Error && e.message === "law_firm_not_found") {
      return NextResponse.json({ error: "Law firm not found" }, { status: 404 });
    }
    console.error("POST /api/firms/stripe-connect/onboarding", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
