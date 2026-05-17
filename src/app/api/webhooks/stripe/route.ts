import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { createStripeClient, StripeNotConfiguredError } from "@/lib/stripe/client";
import {
  handleLeadAcceptPaymentIntentFailed,
  handleLeadAcceptPaymentIntentSucceeded,
} from "@/lib/stripe/connect/handle-lead-accept-payment-intent";
import { syncConnectAccountFromStripe } from "@/lib/stripe/connect/sync-connect-account-from-stripe";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";

/**
 * Stripe webhooks — Connect `account.updated` (§13.3.3), lead accept `payment_intent.*` (§13.5.2).
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook secret is not configured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = createStripeClient();
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (e) {
    if (e instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }
    console.error("Stripe webhook signature verification failed", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      await syncConnectAccountFromStripe(admin, account);
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handleLeadAcceptPaymentIntentSucceeded(admin, paymentIntent);
    }

    if (
      event.type === "payment_intent.payment_failed" ||
      event.type === "payment_intent.canceled"
    ) {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handleLeadAcceptPaymentIntentFailed(admin, paymentIntent);
    }
  } catch (e) {
    if (e instanceof SupabaseAdminKeyMissingError) {
      return NextResponse.json({ error: "Database admin not configured" }, { status: 503 });
    }
    console.error("Stripe webhook handler failed", event.type, e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
