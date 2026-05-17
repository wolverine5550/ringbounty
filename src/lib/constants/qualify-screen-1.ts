/**
 * Phase 7.2 — Screen 1 consent / EBR copy (prd.md §9 Screen 1).
 */

/** Q1 — direct signup / purchase with the caller's company. */
export const QUALIFY_Q1_PROMPT =
  "Did you ever sign up for something, fill out a form, or make a purchase with this company directly?";

/** Q2 — number may have been shared via a related third party. */
export const QUALIFY_Q2_PROMPT =
  "Could you have given your number to a related company, partner site, or third party that might have shared it with this company?";

/** Q3 — ongoing customer / subscriber / borrower relationship. */
export const QUALIFY_Q3_PROMPT =
  "Did you ever have an ongoing account or relationship with this company (for example a customer, subscriber, or borrower)?";

/**
 * Shown when Q1 or Q3 is Yes (prd.md §9 Screen 1 footnote).
 * Informational only — not legal advice.
 */
export const QUALIFY_EBR_EXPLAINER_MESSAGE =
  "Having a relationship with a company doesn't always mean they can call you with a robocaller. But it does affect your claim. We've adjusted your estimate to reflect this.";

/** Persisted on `claim_events` when the EBR explainer applies (§7.2.4). */
export const QUALIFY_EBR_STRENGTH_ADJUSTMENT_NOTE =
  "User reported direct consent and/or an existing business relationship (Q1/Q3). Strength scoring should apply consent/EBR deductions per matrix; include in attorney evidence summary.";
