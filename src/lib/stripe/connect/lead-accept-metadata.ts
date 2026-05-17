/** Stripe metadata key for §13.5 lead accept PaymentIntent / Checkout. */
export const STRIPE_LEAD_ACCEPT_FLOW = "lead_accept" as const;

export const STRIPE_LEAD_ACCEPT_META = {
  flow: "ringbounty_flow",
  leadId: "lead_id",
  firmId: "firm_id",
} as const;
