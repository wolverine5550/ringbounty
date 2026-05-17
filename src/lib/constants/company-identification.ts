/**
 * Phase 6.4 — Company identification for attorney referral path (PRD §7 Step 2, Q13 in Phase 7).
 *
 * v0.1 trust policy (see `docs/company-identification-strategy.md`):
 * - `company_identified = true` only from Nomorobo `reported_name` or user Q13 (`user_input`).
 * - Twilio CNAM and Whitepages are hints only (spoofed / employer ≠ defendant).
 */

/** Shown when Twilio CNAM returned a label but we did not auto-identify (§6.4). */
export const COMPANY_CNAM_HINT_PREFIX =
  "Caller ID showed an unverified name:";

/** Stable token for `claim_events` when referral is blocked pending company ID (legacy key name). */
export const TCPA_LETTER_BLOCKED_COMPANY_UNIDENTIFIED =
  "company_unidentified";

/**
 * Shown on `/check` when spam providers did not resolve a company name (§6.4.4).
 * Full identification happens on qualify Q13 (Phase 7.5); attorney referral stays blocked until then (§6.6).
 */
export const COMPANY_UNIDENTIFIED_CHECK_MESSAGE =
  "We could not automatically identify the company behind this number. You will need to name the caller during qualification before we can connect you with an attorney for this number. If you know who called, continue — you can enter the company name on the next steps.";

/** Returns true when attorney referral should stay blocked for missing company (§6.4.3 / §6.6). */
export function isTcpaLetterBlockedForUnidentifiedCompany(input: {
  companyIdentified: boolean;
  isExempt: boolean;
}): boolean {
  if (input.isExempt) {
    return false;
  }
  return !input.companyIdentified;
}
