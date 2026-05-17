import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import { finalizeLeadAcceptPayment } from "@/lib/firms/finalize-lead-accept-payment";
import { releaseLeadPaymentLock } from "@/lib/firms/release-lead-payment-lock";
import type { Database } from "@/types/database";

import {
  STRIPE_LEAD_ACCEPT_FLOW,
  STRIPE_LEAD_ACCEPT_META,
} from "./lead-accept-metadata";

export function parseLeadAcceptPaymentMetadata(
  metadata: Stripe.Metadata | null | undefined,
): { leadId: string; firmId: string } | null {
  if (!metadata || metadata[STRIPE_LEAD_ACCEPT_META.flow] !== STRIPE_LEAD_ACCEPT_FLOW) {
    return null;
  }

  const leadId = metadata[STRIPE_LEAD_ACCEPT_META.leadId]?.trim();
  const firmId = metadata[STRIPE_LEAD_ACCEPT_META.firmId]?.trim();

  if (!leadId || !firmId) {
    return null;
  }

  return { leadId, firmId };
}

/**
 * §13.5.2 / §13.5.1 — Stripe webhook handlers for firm lead accept payments.
 */
export async function handleLeadAcceptPaymentIntentSucceeded(
  admin: SupabaseClient<Database>,
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> {
  const parsed = parseLeadAcceptPaymentMetadata(paymentIntent.metadata);
  if (!parsed) {
    return;
  }

  await finalizeLeadAcceptPayment(admin, {
    leadId: parsed.leadId,
    firmId: parsed.firmId,
    stripePaymentIntentId: paymentIntent.id,
  });
}

export async function handleLeadAcceptPaymentIntentFailed(
  admin: SupabaseClient<Database>,
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> {
  const parsed = parseLeadAcceptPaymentMetadata(paymentIntent.metadata);
  if (!parsed) {
    return;
  }

  await releaseLeadPaymentLock(admin, {
    leadId: parsed.leadId,
    firmId: parsed.firmId,
  });
}
