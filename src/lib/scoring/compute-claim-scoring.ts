/**
 * Phase 8.5 — Aggregate strength matrix + valuation for one claim (shared by persist + `/results`).
 */

import type { QualifyScreen1Answers } from "@/lib/qualify/screen-1-consent";
import type { QualifyScreen2Answers } from "@/lib/qualify/screen-2-stop-request";
import type { QualifyScreen3Answers } from "@/lib/qualify/screen-3-call-details";
import { aggregateClaimStrength } from "@/lib/scoring/aggregate-claim-strength";
import {
  buildStrengthMatrixInput,
  type ClaimSubjectForStrength,
  type DncRowForStrength,
} from "@/lib/scoring/build-strength-matrix-input";
import { buildViolationCountInput } from "@/lib/scoring/compute-violation-counts";
import {
  computeValuation,
  type ValuationScenarios,
} from "@/lib/scoring/compute-valuation";
import type { PersistedSolFlags } from "@/lib/scoring/sol-claim-events";
import {
  computeStrengthMatrix,
  type StrengthMatrixResult,
  type StrengthMatrixStrength,
} from "@/lib/scoring/strength-matrix";

export type ClaimSubjectScoringRow = ClaimSubjectForStrength & {
  id: string;
};

export type SubjectScoringResult = {
  subjectId: string;
  matrix: StrengthMatrixResult;
  strength: StrengthMatrixStrength;
};

export type ClaimScoringResult = {
  claimStrength: StrengthMatrixStrength;
  /** Minimum subject matrix score (weakest-link companion for audit). */
  claimStrengthScore: number;
  subjects: SubjectScoringResult[];
  valuation: ValuationScenarios | null;
};

export type ComputeClaimScoringParams = {
  subjects: ClaimSubjectScoringRow[];
  dncBySubject: Map<string, DncRowForStrength>;
  screen1: QualifyScreen1Answers | null;
  screen2: QualifyScreen2Answers | null;
  screen3: QualifyScreen3Answers | null;
  sol: PersistedSolFlags | null;
};

/**
 * Runs PRD §8 matrix per subject (weakest-link aggregate) and §11 valuation when Q inputs exist.
 */
export function computeClaimScoring(
  params: ComputeClaimScoringParams,
): ClaimScoringResult {
  const subjects: SubjectScoringResult[] = params.subjects.map((subject) => {
    const matrix = computeStrengthMatrix(
      buildStrengthMatrixInput({
        subject,
        screen1: params.screen1,
        screen2: params.screen2,
        screen3: params.screen3,
        dnc: params.dncBySubject.get(subject.id) ?? null,
        sol: params.sol,
      }),
    );

    return {
      subjectId: subject.id,
      matrix,
      strength: matrix.strength,
    };
  });

  const strengths = subjects.map((s) => s.strength);
  const claimStrength =
    aggregateClaimStrength(strengths) ?? ("ineligible" as const);

  const claimStrengthScore =
    subjects.length === 0
      ? 0
      : Math.min(...subjects.map((s) => s.matrix.totalScore));

  const violationInput = buildViolationCountInput(params.screen2, params.screen3);
  const valuation = violationInput
    ? computeValuation({
        ...violationInput,
        likelyTimeBarred: params.sol?.likelyTimeBarred ?? false,
      })
    : null;

  return {
    claimStrength,
    claimStrengthScore,
    subjects,
    valuation,
  };
}
