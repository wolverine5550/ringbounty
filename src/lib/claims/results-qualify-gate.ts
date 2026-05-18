import { buildQualifyPageHref } from "@/lib/qualify/qualify-step";

/** Claim statuses that may show the attorney referral CTA on `/results`. */
export const CLAIM_STATUSES_WITH_ATTORNEY_CTA = ["qualified"] as const;

export function isClaimQualifiedForAttorneyPath(status: string): boolean {
  return (CLAIM_STATUSES_WITH_ATTORNEY_CTA as readonly string[]).includes(
    status,
  );
}

/**
 * First non-exempt subject on the claim for the qualification wizard entry.
 */
export function pickResultsQualifySubjectId(
  subjects: ReadonlyArray<{ subjectId: string; isExempt: boolean }>,
): string | null {
  const eligible = subjects.find((s) => !s.isExempt);
  return eligible?.subjectId ?? subjects[0]?.subjectId ?? null;
}

export function buildResultsQualifyHref(params: {
  claimId: string;
  subjectId: string;
}): string {
  return buildQualifyPageHref({
    claimSubjectId: params.subjectId,
    claimId: params.claimId,
  });
}
