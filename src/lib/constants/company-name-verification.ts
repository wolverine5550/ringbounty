/**
 * Phase 7.5 — Soft validation after Q13 `user_input` company name (OpenCorporates).
 *
 * Attorney referral is allowed for both verified and unverified; UI shows warning when unverified.
 */

/** `claim_events.key` for post-Q13 OpenCorporates soft check. */
export const COMPANY_NAME_VERIFICATION_STATUS_KEY =
  "company_name_verification_status" as const;

export const USER_INPUT_VERIFIED = "user_input_verified" as const;
export const USER_INPUT_UNVERIFIED = "user_input_unverified" as const;

export type CompanyNameVerificationStatus =
  | typeof USER_INPUT_VERIFIED
  | typeof USER_INPUT_UNVERIFIED;

export const COMPANY_NAME_VERIFICATION_STATUS_VALUES = [
  USER_INPUT_VERIFIED,
  USER_INPUT_UNVERIFIED,
] as const;

/** Shown after Q13 when OpenCorporates finds no match (referral still allowed). */
export const COMPANY_NAME_UNVERIFIED_WARNING =
  "We couldn't verify this company name. Make sure you have the correct legal name before sharing your claim with an attorney.";

export function isCompanyNameVerificationStatus(
  value: unknown,
): value is CompanyNameVerificationStatus {
  return (
    typeof value === "string" &&
    (COMPANY_NAME_VERIFICATION_STATUS_VALUES as readonly string[]).includes(
      value,
    )
  );
}
