/**
 * Phase 6.4 — Company identification for attorney referral path (PRD §7 Step 2, Q13 in Phase 7).
 *
 * v0.1 trust policy (see `docs/company-identification-strategy.md`):
 * - `company_identified = true` only from: **substantive Nomorobo** `reported_name` (Lane A),
 *   **voicemail transcription** (qualify §7.5.4), or **user Q13** (`user_input`).
 * - Placeholders such as `UNKNOWN` are not identified — Whitepages may still run on `/check`.
 * - Twilio CNAM and Whitepages are hints only (spoofed / employer ≠ defendant).
 * - **Company Intelligence Agent (v1):** does **not** set `company_identified` — suggest-only
 *   (`company_name_suggested` on subject + `company_identification_source=company_intelligence`
 *   on `claim_events`; see `docs/spikes/20260519140000-company-identification-source-audit.md`).
 *
 * Event key split (audit CI-P.3): Lane A spam uses `company_name_source` on `spam_db_match`;
 * qualify/voicemail/agent use `company_identification_source` on `qualification_answer` (agent in CI-3).
 */

/** Nomorobo / user strings that must not count as an identified defendant (§6.4). */
const PLACEHOLDER_COMPANY_NAMES = new Set([
  "unknown",
  "n/a",
  "na",
  "not sure",
  "unsure",
  "none",
]);

/**
 * True when a company name is more than a placeholder (spam merge, qualify consent, RA lookup).
 */
export function isSubstantiveCompanyName(
  companyName: string | null | undefined,
): boolean {
  const trimmed = companyName?.trim() ?? "";
  if (trimmed.length < 2) {
    return false;
  }
  return !PLACEHOLDER_COMPANY_NAMES.has(trimmed.toLowerCase());
}

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
