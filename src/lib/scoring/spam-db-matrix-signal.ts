/**
 * Phase 5.6.2 / PRD §8 — Spam-database rows on the claim-strength matrix.
 *
 * Providers set `isSpam` at score ≥ 80 ({@link NOMOROBO_SPAM_THRESHOLD} / Twilio quality threshold).
 * Scores below 80 still mean the APIs returned data (“in database, low confidence” → +15).
 * No score and not a known spammer → no match (+0).
 */

import type { MergedSpamCheckOutcome } from "@/lib/spam/merge-spam-results";
import { NOMOROBO_SPAM_THRESHOLD } from "@/lib/spam/nomorobo-spam-provider";

/** PRD §8 matrix: high-confidence spam DB hit. */
export const SPAM_DB_MATRIX_HIGH_CONFIDENCE_POINTS = 30;

/** PRD §8 matrix: low-confidence spam DB hit (score present but below threshold). */
export const SPAM_DB_MATRIX_LOW_CONFIDENCE_POINTS = 15;

/** PRD §8 matrix: no spam-database match (or exempt — exempt override is applied separately in Phase 8). */
export const SPAM_DB_MATRIX_NO_MATCH_POINTS = 0;

/** Same band as provider `isSpam` thresholds and PRD §8 “high confidence (>80)”. */
export const SPAM_DB_MATRIX_HIGH_CONFIDENCE_THRESHOLD =
  NOMOROBO_SPAM_THRESHOLD;

export type SpamDbMatrixTier = "high" | "low" | "none";

export type SpamDbMatrixSignal = {
  tier: SpamDbMatrixTier;
  points: number;
};

/**
 * Derives PRD §8 spam-database points from a merged spam outcome.
 * Exempt subjects return `none` / 0 here; Phase 8 applies the -100 exempt override separately.
 */
export function resolveSpamDbMatrixSignal(
  merged: Pick<
    MergedSpamCheckOutcome,
    "isKnownSpammer" | "confidenceScore" | "isExempt"
  >,
): SpamDbMatrixSignal {
  if (merged.isExempt) {
    return { tier: "none", points: SPAM_DB_MATRIX_NO_MATCH_POINTS };
  }

  const score = merged.confidenceScore;

  if (
    merged.isKnownSpammer &&
    (score === null || score >= SPAM_DB_MATRIX_HIGH_CONFIDENCE_THRESHOLD)
  ) {
    return {
      tier: "high",
      points: SPAM_DB_MATRIX_HIGH_CONFIDENCE_POINTS,
    };
  }

  if (score !== null && score < SPAM_DB_MATRIX_HIGH_CONFIDENCE_THRESHOLD) {
    return {
      tier: "low",
      points: SPAM_DB_MATRIX_LOW_CONFIDENCE_POINTS,
    };
  }

  return { tier: "none", points: SPAM_DB_MATRIX_NO_MATCH_POINTS };
}
