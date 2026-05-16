/** Allowed `newsletter_waitlist.source` values (must match DB check constraint). */
export const WAITLIST_SOURCES = [
  "ineligible_check",
  "exempt_only",
  "debt_collection_interest",
  "notify_me_cta",
  "blocked_flow",
] as const;

export type WaitlistSource = (typeof WAITLIST_SOURCES)[number];

/** Placeholder marketing consent copy (§2.8.1) — replace after legal review. */
export const MARKETING_CONSENT_LABEL =
  "Send me occasional product updates and tips about consumer rights (you can unsubscribe anytime).";

export const MARKETING_CONSENT_FOOTNOTE =
  "Placeholder consent text for MVP. Final copy will be reviewed for CAN-SPAM / GDPR.";
