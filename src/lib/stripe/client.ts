import Stripe from "stripe";

/**
 * Server-only Stripe secret key (Dashboard → Developers → API keys).
 */
export function getStripeSecretKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY;
}

/** Thrown when `STRIPE_SECRET_KEY` is unset (local dev without Stripe). */
export class StripeNotConfiguredError extends Error {
  constructor() {
    super("STRIPE_SECRET_KEY is not configured");
    this.name = "StripeNotConfiguredError";
  }
}

let stripeSingleton: Stripe | null = null;

/**
 * Lazy Stripe client for server routes and webhooks.
 */
export function createStripeClient(): Stripe {
  const key = getStripeSecretKey();
  if (!key) {
    throw new StripeNotConfiguredError();
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}
