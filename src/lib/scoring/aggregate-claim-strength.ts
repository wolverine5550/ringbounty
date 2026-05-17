/**
 * Phase 8.4 — Aggregate per-subject strength to claim-level (weakest-link until §8.5 persists).
 */

import type { ClaimStrengthGate } from "@/lib/claims/successful-query";
import type { StrengthMatrixStrength } from "@/lib/scoring/strength-matrix";

const STRENGTH_RANK: Record<StrengthMatrixStrength, number> = {
  ineligible: 0,
  weak: 1,
  moderate: 2,
  strong: 3,
};

/**
 * Weakest band wins (conservative for attorney referral / email capture).
 */
export function aggregateClaimStrength(
  strengths: StrengthMatrixStrength[],
): StrengthMatrixStrength | null {
  if (strengths.length === 0) {
    return null;
  }

  return strengths.reduce((weakest, current) =>
    STRENGTH_RANK[current] < STRENGTH_RANK[weakest] ? current : weakest,
  );
}

/**
 * Prefer persisted `claims.claim_strength`; otherwise compute weakest-link.
 */
export function resolveEffectiveClaimStrength(params: {
  persisted: ClaimStrengthGate;
  computed: StrengthMatrixStrength | null;
}): ClaimStrengthGate {
  if (params.persisted !== null) {
    return params.persisted;
  }
  return params.computed;
}
