import { buildLoginHrefForClaim } from "@/lib/claims/gated-routes";
import { buildQualifyPageHref } from "@/lib/qualify/qualify-step";

import type { NumberCheckSummary } from "@/lib/check/parallel-check-pipeline-stub";

export type CheckFunnelContinueTarget = {
  qualifyHref: string;
  /** When anonymous user must sign in before qualify (successful-query gate). */
  signInHref: string | null;
};

/**
 * First subject on the claim that is eligible for the qualification wizard.
 */
export function pickQualifySubjectId(
  numberChecks: NumberCheckSummary[],
  claimSubjectIds: string[],
): string | null {
  for (const row of numberChecks) {
    if (row.is_exempt) {
      continue;
    }
    if (row.claim_subject_id) {
      return row.claim_subject_id;
    }
  }
  return claimSubjectIds[0] ?? null;
}

/** True when every checked row is TCPA-exempt (no qualification path). */
export function allNumberChecksExempt(numberChecks: NumberCheckSummary[]): boolean {
  return (
    numberChecks.length > 0 &&
    numberChecks.every((row) => row.is_exempt === true)
  );
}

/**
 * Builds qualify + optional sign-in links after a successful `/api/check/submit`.
 */
export function buildCheckFunnelContinueTarget(params: {
  claimId: string;
  claimSubjectIds: string[];
  numberChecks: NumberCheckSummary[];
  requiresAccountWall: boolean;
}): CheckFunnelContinueTarget | null {
  const subjectId = pickQualifySubjectId(
    params.numberChecks,
    params.claimSubjectIds,
  );
  if (!subjectId) {
    return null;
  }

  const qualifyHref = buildQualifyPageHref({
    claimSubjectId: subjectId,
    claimId: params.claimId,
  });

  return {
    qualifyHref,
    signInHref: params.requiresAccountWall
      ? buildLoginHrefForClaim({
          returnPath: qualifyHref,
          claimId: params.claimId,
        })
      : null,
  };
}
