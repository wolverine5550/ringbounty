/**
 * Phase 13.3.1 — Stripe Connect settings for law firms.
 *
 * **Decision: Express accounts.** Stripe hosts onboarding/KYC; RingBounty keeps the platform
 * account and can collect application fees on lead accept (§13.5.1). Standard accounts would
 * require firms to manage a full Stripe Dashboard; Express fits the firm portal model.
 *
 * Enable Connect in the Stripe Dashboard (Settings → Connect) before onboarding firms.
 */

/** Connect account type created for each `law_firms` row. */
export const STRIPE_CONNECT_ACCOUNT_TYPE = "express" as const;

/** Default country for firm Connect accounts (v0.2 US attorney network). */
export const STRIPE_CONNECT_DEFAULT_COUNTRY = "US" as const;

/** Return URL path after Stripe onboarding (firm UI ships in §13.4). */
export const STRIPE_CONNECT_ONBOARDING_RETURN_PATH =
  "/firms/onboarding/stripe/complete" as const;

/** Refresh URL when onboarding link expires (§13.4). */
export const STRIPE_CONNECT_ONBOARDING_REFRESH_PATH =
  "/firms/onboarding/stripe/refresh" as const;
