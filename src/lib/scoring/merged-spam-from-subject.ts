/**
 * Phase 8.4 — Reconstruct matrix spam input from persisted `claim_subjects` columns.
 */

import type { MergedSpamCheckOutcome } from "@/lib/spam/merge-spam-results";
import { NOMOROBO_SPAM_THRESHOLD } from "@/lib/spam/nomorobo-spam-provider";

export type ClaimSubjectSpamRow = {
  spam_db_confidence_score: number | null;
  is_exempt: boolean;
};

/**
 * Minimal {@link MergedSpamCheckOutcome} slice for {@link resolveSpamDbMatrixSignal}.
 */
export function mergedSpamFromClaimSubject(
  row: ClaimSubjectSpamRow,
): Pick<MergedSpamCheckOutcome, "isKnownSpammer" | "confidenceScore" | "isExempt"> {
  const score = row.spam_db_confidence_score;
  const isKnownSpammer =
    score !== null && Number.isFinite(score) && score >= NOMOROBO_SPAM_THRESHOLD;

  return {
    isKnownSpammer,
    confidenceScore: score,
    isExempt: row.is_exempt,
  };
}
