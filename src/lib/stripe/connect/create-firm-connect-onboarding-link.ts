import type { Stripe } from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { createStripeClient } from "@/lib/stripe/client";

import {
  STRIPE_CONNECT_ACCOUNT_TYPE,
  STRIPE_CONNECT_DEFAULT_COUNTRY,
  STRIPE_CONNECT_ONBOARDING_REFRESH_PATH,
  STRIPE_CONNECT_ONBOARDING_RETURN_PATH,
} from "./constants";
import { resolveSiteOrigin } from "./resolve-site-origin";

export type CreateFirmConnectOnboardingLinkParams = {
  firmId: string;
};

export type CreateFirmConnectOnboardingLinkResult = {
  url: string;
  stripeConnectAccountId: string;
  expiresAt: number;
};

type LawFirmStripeRow = {
  id: string;
  name: string;
  contact_email: string;
  stripe_connect_account_id: string | null;
};

/**
 * Ensures a Connect Express account exists for the firm, then returns an Account Link URL.
 */
export async function createFirmConnectOnboardingLink(
  admin: SupabaseClient<Database>,
  stripe: Stripe,
  params: CreateFirmConnectOnboardingLinkParams,
): Promise<CreateFirmConnectOnboardingLinkResult> {
  const { data: firm, error: firmError } = await admin
    .from("law_firms")
    .select("id, name, contact_email, stripe_connect_account_id")
    .eq("id", params.firmId)
    .maybeSingle();

  if (firmError) {
    throw firmError;
  }

  if (!firm?.id) {
    throw new Error("law_firm_not_found");
  }

  const row = firm as LawFirmStripeRow;
  let accountId = row.stripe_connect_account_id?.trim() || null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: STRIPE_CONNECT_ACCOUNT_TYPE,
      country: STRIPE_CONNECT_DEFAULT_COUNTRY,
      email: row.contact_email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        law_firm_id: row.id,
        law_firm_name: row.name,
      },
    });

    accountId = account.id;

    const { error: updateError } = await admin
      .from("law_firms")
      .update({ stripe_connect_account_id: accountId })
      .eq("id", row.id);

    if (updateError) {
      throw updateError;
    }
  }

  const origin = resolveSiteOrigin();
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    return_url: `${origin}${STRIPE_CONNECT_ONBOARDING_RETURN_PATH}`,
    refresh_url: `${origin}${STRIPE_CONNECT_ONBOARDING_REFRESH_PATH}`,
  });

  if (!accountLink.url) {
    throw new Error("stripe_account_link_missing_url");
  }

  return {
    url: accountLink.url,
    stripeConnectAccountId: accountId,
    expiresAt: accountLink.expires_at,
  };
}

/**
 * Convenience wrapper using the shared Stripe client singleton.
 */
export async function createFirmConnectOnboardingLinkWithDefaultClient(
  admin: SupabaseClient<Database>,
  params: CreateFirmConnectOnboardingLinkParams,
): Promise<CreateFirmConnectOnboardingLinkResult> {
  return createFirmConnectOnboardingLink(admin, createStripeClient(), params);
}
