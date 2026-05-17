/**
 * Phase 8.5.2 — `claim_events` keys for strength + valuation audit (`value_calculated`).
 */

import type { ClaimEventType } from "@/lib/constants/claimEvent";

export const SCORING_VALUE_CALCULATED_EVENT: ClaimEventType = "value_calculated";

/** Claim-level strength + valuation outputs (§8.5.1 / §8.5.2). */
export const SCORING_CLAIM_EVENT_KEYS = {
  claimStrength: "claim_strength",
  claimStrengthScore: "claim_strength_score",
  aggregateMethod: "claim_strength_aggregate_method",
  estimatedValueLowCents: "estimated_value_low_cents",
  estimatedValueHighCents: "estimated_value_high_cents",
  estimatedValueRealisticCents: "estimated_value_realistic_cents",
  estimatedValueMaximumCents: "estimated_value_maximum_cents",
  standardViolationCount: "standard_violation_count",
  willfulViolationCount: "willful_violation_count",
  timeViolationCount: "time_violation_count",
  /** JSON: per-subject matrix snapshot (strength, score, breakdown). */
  subjectMatrixSnapshots: "subject_matrix_snapshots",
} as const;

export const CLAIM_STRENGTH_AGGREGATE_METHOD = "weakest_link" as const;
