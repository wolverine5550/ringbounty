/**
 * Phase 7.6 — Screen 5 cell vs residential attestation copy (prd.md §9).
 *
 * Neutral framing only — does not advise legal outcome (counsel review in task_manager §Open).
 */

/** Primary attestation question (§7.6.1). */
export const QUALIFY_LINE_TYPE_PROMPT =
  "Was this number calling your mobile phone or a home/landline?";

/** Shown under the question — informational, not outcome advice. */
export const QUALIFY_LINE_TYPE_HELPER =
  "Your answer is saved with your claim for review. It does not determine whether you have a legal claim.";

/** Option labels for the two attestation choices. */
export const QUALIFY_LINE_TYPE_OPTION_MOBILE = "Mobile phone";
export const QUALIFY_LINE_TYPE_OPTION_RESIDENTIAL = "Home or landline";
