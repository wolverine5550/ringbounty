/**
 * Phase 6.6 — Attorney referral eligibility (replaces DIY demand letter purchase).
 */

/** Stable reason codes returned from {@link canReferToAttorney}. */
export const ATTORNEY_REFERRAL_REASON_EXEMPT = "exempt" as const;
export const ATTORNEY_REFERRAL_REASON_CLAIM_INELIGIBLE =
  "claim_ineligible" as const;
export const ATTORNEY_REFERRAL_REASON_COMPANY_UNIDENTIFIED =
  "company_unidentified" as const;
export const ATTORNEY_REFERRAL_REASON_FDCPA_DEBT_COLLECTION =
  "fdcpa_debt_collection" as const;

export type AttorneyReferralBlockReason =
  | typeof ATTORNEY_REFERRAL_REASON_EXEMPT
  | typeof ATTORNEY_REFERRAL_REASON_CLAIM_INELIGIBLE
  | typeof ATTORNEY_REFERRAL_REASON_COMPANY_UNIDENTIFIED
  | typeof ATTORNEY_REFERRAL_REASON_FDCPA_DEBT_COLLECTION;

/** Primary results CTA label (PRD / §8.4.5; wired on `/results` in §7.7.2). */
export const ATTORNEY_REFERRAL_CTA_LABEL = "Connect with an attorney — free" as const;
