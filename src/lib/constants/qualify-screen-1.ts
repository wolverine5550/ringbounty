/**
 * Phase 7.2 / 7.5 — Consent / EBR copy (asked on wizard step 5 after company is named).
 */

/** Q1 — permission to call, only after {{company}} is known. */
export const QUALIFY_Q1_PROMPT =
  "Did you give {{company}} permission to contact you — for example by signing up, filling out a form, or making a purchase?";

/** Q3 — ongoing relationship with the named company. */
export const QUALIFY_Q3_PROMPT =
  "Did you ever have an ongoing account or relationship with {{company}} (for example as a customer, subscriber, or borrower)?";

/** Shown on step 5 before consent questions. */
export const QUALIFY_CONSENT_STEP_PREFACE =
  "Answer based on the company you identified in the previous step. If you are not sure, choose No.";

/**
 * Shown when Q1 or Q3 is Yes (prd.md §9 Screen 1 footnote).
 * Informational only — not legal advice.
 */
export const QUALIFY_EBR_EXPLAINER_MESSAGE =
  "Having a relationship with a company doesn't always mean they can call you with a robocaller. But it does affect your claim. We've adjusted your estimate to reflect this.";

/** Persisted on `claim_events` when the EBR explainer applies (§7.2.4). */
export const QUALIFY_EBR_STRENGTH_ADJUSTMENT_NOTE =
  "User reported direct consent and/or an existing business relationship (Q1/Q3). Strength scoring should apply consent/EBR deductions per matrix; include in attorney evidence summary.";
