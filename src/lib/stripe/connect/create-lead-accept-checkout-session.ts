import type { Stripe } from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import { FIRM_PORTAL_HOME_PATH } from "@/lib/firms/firm-portal-host";
import { lockLeadForPayment } from "@/lib/firms/lock-lead-for-payment";
import { createStripeClient } from "@/lib/stripe/client";
import type { Database } from "@/types/database";

import {
  STRIPE_LEAD_ACCEPT_FLOW,
  STRIPE_LEAD_ACCEPT_META,
} from "./lead-accept-metadata";
import { resolveSiteOrigin } from "./resolve-site-origin";

export type CreateLeadAcceptCheckoutSessionParams = {
  leadId: string;
  firmId: string;
  firmName: string;
};

export type CreateLeadAcceptCheckoutSessionResult = {
  checkoutUrl: string;
  sessionId: string;
  leadFeeCents: number;
};

type LawFirmBillingRow = {
  id: string;
  name: string;
  lead_fee_cents: number | null;
  stripe_connect_account_id: string | null;
  stripe_connect_charges_enabled: boolean;
};

/**
 * §13.5.1 — Direct charge on firm Connect account; platform fee via `application_fee_amount`.
 * Creates a PaymentIntent under the hood (Checkout `payment` mode).
 */
export async function createLeadAcceptCheckoutSession(
  admin: SupabaseClient<Database>,
  stripe: Stripe,
  params: CreateLeadAcceptCheckoutSessionParams,
): Promise<CreateLeadAcceptCheckoutSessionResult> {
  const { data: firm, error: firmError } = await admin
    .from("law_firms")
    .select(
      "id, name, lead_fee_cents, stripe_connect_account_id, stripe_connect_charges_enabled",
    )
    .eq("id", params.firmId)
    .maybeSingle();

  if (firmError) {
    throw firmError;
  }

  const row = firm as LawFirmBillingRow | null;
  if (!row?.id) {
    throw new Error("law_firm_not_found");
  }

  if (!row.stripe_connect_account_id?.trim()) {
    throw new Error("stripe_connect_not_linked");
  }

  if (!row.stripe_connect_charges_enabled) {
    throw new Error("stripe_connect_charges_disabled");
  }

  const leadFeeCents = row.lead_fee_cents ?? 0;
  if (leadFeeCents < 50) {
    throw new Error("lead_fee_not_configured");
  }

  const lock = await lockLeadForPayment(admin, {
    leadId: params.leadId,
    firmId: params.firmId,
    leadFeeCents,
  });

  if (!lock.locked) {
    throw new Error(lock.reason === "already_assigned" ? "lead_already_taken" : "lead_not_available");
  }

  const origin = resolveSiteOrigin();
  const successUrl = `${origin}${FIRM_PORTAL_HOME_PATH}?payment=success&lead_id=${encodeURIComponent(params.leadId)}`;
  const cancelUrl = `${origin}${FIRM_PORTAL_HOME_PATH}?payment=cancelled&lead_id=${encodeURIComponent(params.leadId)}`;

  const metadata = {
    [STRIPE_LEAD_ACCEPT_META.flow]: STRIPE_LEAD_ACCEPT_FLOW,
    [STRIPE_LEAD_ACCEPT_META.leadId]: params.leadId,
    [STRIPE_LEAD_ACCEPT_META.firmId]: params.firmId,
  };

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: leadFeeCents,
              product_data: {
                name: "Attorney referral lead",
                description: `Lead accept — ${params.firmName || row.name}`,
              },
            },
          },
        ],
        payment_intent_data: {
          application_fee_amount: leadFeeCents,
          metadata,
        },
        metadata,
        success_url: successUrl,
        cancel_url: cancelUrl,
      },
      { stripeAccount: row.stripe_connect_account_id.trim() },
    );

    if (!session.url) {
      throw new Error("stripe_checkout_missing_url");
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (paymentIntentId) {
      await admin
        .from("leads")
        .update({ stripe_payment_intent_id: paymentIntentId })
        .eq("id", params.leadId)
        .eq("assigned_firm_id", params.firmId);
    }

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
      leadFeeCents,
    };
  } catch (e) {
    await admin
      .from("leads")
      .update({
        assigned_firm_id: null,
        status: "new",
        stripe_payment_intent_id: null,
        lead_fee_cents: null,
      })
      .eq("id", params.leadId)
      .eq("assigned_firm_id", params.firmId)
      .eq("status", "reviewed");

    throw e;
  }
}

export async function createLeadAcceptCheckoutSessionWithDefaultClient(
  admin: SupabaseClient<Database>,
  params: CreateLeadAcceptCheckoutSessionParams,
): Promise<CreateLeadAcceptCheckoutSessionResult> {
  return createLeadAcceptCheckoutSession(admin, createStripeClient(), params);
}
