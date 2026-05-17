/**
 * Phase 8.1 — PRD §8 claim-strength matrix: aggregate signals → score → strength band.
 */

import type { ClaimStrengthGate } from "@/lib/claims/successful-query";
import type { MergedSpamCheckOutcome } from "@/lib/spam/merge-spam-results";

import {
  STRENGTH_MATRIX_CALL_PATTERN_MIN_TOTAL,
  STRENGTH_MATRIX_CALL_PATTERN_POINTS,
  STRENGTH_MATRIX_COMPANY_IDENTIFIED_POINTS,
  STRENGTH_MATRIX_COMPANY_UNIDENTIFIED_POINTS,
  STRENGTH_MATRIX_DIRECT_CONSENT_POINTS,
  STRENGTH_MATRIX_EXISTING_RELATIONSHIP_POINTS,
  STRENGTH_MATRIX_EXEMPT_POINTS,
  STRENGTH_MATRIX_OUTSIDE_SOL_POINTS,
  STRENGTH_MATRIX_REGISTERED_AGENT_POINTS,
  STRENGTH_MATRIX_SINGLE_CALL_POINTS,
  STRENGTH_MATRIX_THIRD_PARTY_CONSENT_POINTS,
  STRENGTH_MATRIX_THRESHOLD_MODERATE,
  STRENGTH_MATRIX_THRESHOLD_STRONG,
  STRENGTH_MATRIX_THRESHOLD_WEAK,
  STRENGTH_MATRIX_TIME_OF_DAY_POINTS,
  STRENGTH_MATRIX_WILLFUL_STOP_IGNORED_POINTS,
  STRENGTH_MATRIX_WITHIN_FEDERAL_SOL_POINTS,
} from "./strength-matrix-constants";
import { resolveFederalDncMatrixSignal } from "./federal-dnc-matrix-signal";
import { resolveSpamDbMatrixSignal } from "./spam-db-matrix-signal";
import { resolveStateDncMatrixSignal } from "./state-dnc-matrix-signal";

export type StrengthMatrixStrength = Exclude<ClaimStrengthGate, null>;

/** PRD §8 signal keys for audit breakdown (Phase 8.5). */
export type StrengthMatrixSignalKey =
  | "exempt"
  | "spam_db"
  | "federal_dnc"
  | "state_dnc"
  | "willful_stop_ignored"
  | "time_of_day"
  | "call_pattern"
  | "company_identified"
  | "company_unidentified"
  | "registered_agent"
  | "within_federal_sol"
  | "outside_sol"
  | "direct_consent"
  | "existing_relationship"
  | "third_party_consent"
  | "single_call";

export type StrengthMatrixBreakdownItem = {
  signal: StrengthMatrixSignalKey;
  points: number;
  applied: boolean;
};

/**
 * Phase 8.1.2 — Inputs for one subject (or pre-merged claim slice).
 * Omitted / null fields are treated as “unknown” and do not award points.
 */
export type StrengthMatrixInput = {
  isExempt: boolean;

  /** When set, spam DB tier is derived via {@link resolveSpamDbMatrixSignal}. */
  mergedSpam?: Pick<
    MergedSpamCheckOutcome,
    "isKnownSpammer" | "confidenceScore" | "isExempt"
  >;

  federalDncEligible?: boolean | null;
  attestedFederalDncByUser?: boolean;
  stateDncApplicable?: boolean | null;
  stateDncRegistered?: boolean | null;

  stopRequestMade?: boolean;
  /** Q7 — calls after stop request (willful when true). */
  callsAfterStopRequest?: boolean | null;

  callsBefore8am?: boolean;
  callsAfter9pm?: boolean;

  /** Q8 bucket lower bound (1, 2, 5, 10, 20). */
  callCountTotal?: number | null;

  companyIdentified?: boolean;
  registeredAgentFound?: boolean;

  withinFederalSol?: boolean | null;
  withinStateSol?: boolean | null;

  gaveDirectConsent?: boolean | null;
  hasExistingRelationship?: boolean | null;
  thirdPartyConsentPossible?: boolean | null;
};

export type StrengthMatrixResult = {
  totalScore: number;
  strength: StrengthMatrixStrength;
  /** True when `isExempt` forced `ineligible` regardless of score. */
  exemptOverride: boolean;
  breakdown: StrengthMatrixBreakdownItem[];
};

function pushBreakdown(
  breakdown: StrengthMatrixBreakdownItem[],
  item: StrengthMatrixBreakdownItem,
): number {
  breakdown.push(item);
  return item.applied ? item.points : 0;
}

/**
 * Phase 8.1.4 — Maps PRD §8 score bands to strength labels.
 * Exempt subjects must call {@link computeStrengthMatrix} (applies override).
 */
export function mapScoreToClaimStrength(
  totalScore: number,
): Exclude<StrengthMatrixStrength, "ineligible"> | "ineligible" {
  if (totalScore >= STRENGTH_MATRIX_THRESHOLD_STRONG) {
    return "strong";
  }
  if (totalScore >= STRENGTH_MATRIX_THRESHOLD_MODERATE) {
    return "moderate";
  }
  if (totalScore >= STRENGTH_MATRIX_THRESHOLD_WEAK) {
    return "weak";
  }
  return "ineligible";
}

/**
 * Phase 8.1.3–8.1.4 — Compute matrix score and strength for one subject.
 */
export function computeStrengthMatrix(
  input: StrengthMatrixInput,
): StrengthMatrixResult {
  const breakdown: StrengthMatrixBreakdownItem[] = [];

  if (input.isExempt) {
    const points = STRENGTH_MATRIX_EXEMPT_POINTS;
    breakdown.push({ signal: "exempt", points, applied: true });
    return {
      totalScore: points,
      strength: "ineligible",
      exemptOverride: true,
      breakdown,
    };
  }

  let totalScore = 0;

  if (input.mergedSpam) {
    const spam = resolveSpamDbMatrixSignal(input.mergedSpam);
    totalScore += pushBreakdown(breakdown, {
      signal: "spam_db",
      points: spam.points,
      applied: spam.points !== 0,
    });
  }

  const federalDnc = resolveFederalDncMatrixSignal({
    federalDncEligible: input.federalDncEligible,
    attestedByUser: input.attestedFederalDncByUser,
  });
  totalScore += pushBreakdown(breakdown, {
    signal: "federal_dnc",
    points: federalDnc.points,
    applied: federalDnc.points !== 0,
  });

  const stateDnc = resolveStateDncMatrixSignal({
    stateDncApplicable: input.stateDncApplicable,
    stateDncRegistered: input.stateDncRegistered,
  });
  totalScore += pushBreakdown(breakdown, {
    signal: "state_dnc",
    points: stateDnc.points,
    applied: stateDnc.points !== 0,
  });

  const willfulApplied =
    input.stopRequestMade === true && input.callsAfterStopRequest === true;
  totalScore += pushBreakdown(breakdown, {
    signal: "willful_stop_ignored",
    points: STRENGTH_MATRIX_WILLFUL_STOP_IGNORED_POINTS,
    applied: willfulApplied,
  });

  const timeOfDayApplied =
    input.callsBefore8am === true || input.callsAfter9pm === true;
  totalScore += pushBreakdown(breakdown, {
    signal: "time_of_day",
    points: STRENGTH_MATRIX_TIME_OF_DAY_POINTS,
    applied: timeOfDayApplied,
  });

  const patternApplied =
    input.callCountTotal != null &&
    input.callCountTotal >= STRENGTH_MATRIX_CALL_PATTERN_MIN_TOTAL;
  totalScore += pushBreakdown(breakdown, {
    signal: "call_pattern",
    points: STRENGTH_MATRIX_CALL_PATTERN_POINTS,
    applied: patternApplied,
  });

  if (input.companyIdentified === true) {
    totalScore += pushBreakdown(breakdown, {
      signal: "company_identified",
      points: STRENGTH_MATRIX_COMPANY_IDENTIFIED_POINTS,
      applied: true,
    });
  } else if (input.companyIdentified === false) {
    totalScore += pushBreakdown(breakdown, {
      signal: "company_unidentified",
      points: STRENGTH_MATRIX_COMPANY_UNIDENTIFIED_POINTS,
      applied: true,
    });
  }

  const raApplied = input.registeredAgentFound === true;
  totalScore += pushBreakdown(breakdown, {
    signal: "registered_agent",
    points: STRENGTH_MATRIX_REGISTERED_AGENT_POINTS,
    applied: raApplied,
  });

  const withinFederalSolApplied = input.withinFederalSol === true;
  totalScore += pushBreakdown(breakdown, {
    signal: "within_federal_sol",
    points: STRENGTH_MATRIX_WITHIN_FEDERAL_SOL_POINTS,
    applied: withinFederalSolApplied,
  });

  const outsideSolApplied =
    input.withinFederalSol === false && input.withinStateSol === false;
  totalScore += pushBreakdown(breakdown, {
    signal: "outside_sol",
    points: STRENGTH_MATRIX_OUTSIDE_SOL_POINTS,
    applied: outsideSolApplied,
  });

  const directConsentApplied = input.gaveDirectConsent === true;
  totalScore += pushBreakdown(breakdown, {
    signal: "direct_consent",
    points: STRENGTH_MATRIX_DIRECT_CONSENT_POINTS,
    applied: directConsentApplied,
  });

  const ebrApplied = input.hasExistingRelationship === true;
  totalScore += pushBreakdown(breakdown, {
    signal: "existing_relationship",
    points: STRENGTH_MATRIX_EXISTING_RELATIONSHIP_POINTS,
    applied: ebrApplied,
  });

  const thirdPartyApplied = input.thirdPartyConsentPossible === true;
  totalScore += pushBreakdown(breakdown, {
    signal: "third_party_consent",
    points: STRENGTH_MATRIX_THIRD_PARTY_CONSENT_POINTS,
    applied: thirdPartyApplied,
  });

  const singleCallApplied = input.callCountTotal === 1;
  totalScore += pushBreakdown(breakdown, {
    signal: "single_call",
    points: STRENGTH_MATRIX_SINGLE_CALL_POINTS,
    applied: singleCallApplied,
  });

  const strength = mapScoreToClaimStrength(totalScore);

  return {
    totalScore,
    strength,
    exemptOverride: false,
    breakdown,
  };
}
