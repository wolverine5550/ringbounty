/**
 * Phase 5.7 — Debt collection / FDCPA handling (PRD §6 debt_collection exempt + §5.7).
 *
 * Debt collection is TCPA-exempt via {@link resolveExemptCategory}; this module adds
 * FDCPA-specific user copy and TCPA attorney-referral blocking for downstream phases.
 */

import {
  resolveExemptCategory,
  type ExemptCategory,
} from "@/lib/constants/exempt-categories";

export const DEBT_COLLECTION_EXEMPT_CATEGORY =
  "debt_collection" satisfies ExemptCategory;

/**
 * Informational callout when spam DB category indicates debt collection (§5.7.1).
 * Does not promise future FDCPA product — see optional email capture (§5.7.2).
 */
export const FDCPA_DEBT_COLLECTION_USER_MESSAGE =
  "This number looks like a debt collection call. The Fair Debt Collection Practices Act (FDCPA) may apply instead of the TCPA rules we screen for here. We cannot offer a TCPA robocall attorney referral for this number, and it is excluded from your claim estimate.";

/** Stable token for `claim_events` when TCPA attorney referral is blocked for this subject (legacy key). */
export const TCPA_LETTER_BLOCKED_FDCPA_DEBT = "fdcpa_debt_collection";

/** Returns true when merged `call_category` resolves to debt collection. */
export function isDebtCollectionCallCategory(
  callCategory: string | null | undefined,
): boolean {
  return (
    resolveExemptCategory(callCategory) === DEBT_COLLECTION_EXEMPT_CATEGORY
  );
}

/**
 * Whether TCPA attorney referral should be blocked for this subject (§5.7.1 / §6.6).
 * {@link canReferToAttorney} consults this in addition to `is_exempt`.
 */
export function isTcpaLetterBlockedForCallCategory(
  callCategory: string | null | undefined,
): boolean {
  return isDebtCollectionCallCategory(callCategory);
}
