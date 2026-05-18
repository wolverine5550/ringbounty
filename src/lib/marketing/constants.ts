/**
 * PRD §3 — product disclaimer (exact string). Rendered via `DisclaimerBanner` (§3.6).
 */
export const PRODUCT_DISCLAIMER =
  "RingBounty is not a law firm and does not provide legal advice. Information provided is for general informational purposes only. Estimated values are based on statutory amounts and are not guarantees of any outcome. For advice about your specific situation, consult a licensed attorney." as const;

/** Trust strip copy for landing (§3.1.3). */
export const TRUST_STRIP_LINE =
  "Not a law firm · Estimates are informational, not guarantees of any outcome";

export const SITE_NAME = "RingBounty";

/** Static copyright year (Cache Components disallow `new Date()` in static RSC). */
export const COPYRIGHT_YEAR = 2026;

/** Default marketing meta description (§3.1.5). */
export const DEFAULT_MARKETING_DESCRIPTION =
  "Screen spam calls for potential TCPA issues, see informational claim strength, and optionally connect with a participating attorney — general information only, not legal advice.";
