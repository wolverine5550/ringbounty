/**
 * Phase 6.6 — Central gate for “Connect with an attorney” and evidence handoff.
 *
 * Uses persisted claim/subject fields only (no hidden heuristics).
 * Federal DNC / SOL warnings are informational elsewhere — they do not block here.
 */

import {
  ATTORNEY_REFERRAL_REASON_CLAIM_INELIGIBLE,
  ATTORNEY_REFERRAL_REASON_COMPANY_UNIDENTIFIED,
  ATTORNEY_REFERRAL_REASON_EXEMPT,
  ATTORNEY_REFERRAL_REASON_FDCPA_DEBT_COLLECTION,
  type AttorneyReferralBlockReason,
} from "@/lib/constants/attorney-referral";
import { isTcpaLetterBlockedForUnidentifiedCompany } from "@/lib/constants/company-identification";
import { isTcpaLetterBlockedForCallCategory } from "@/lib/constants/fdcpa-debt-collection";

import type { ClaimStrengthGate } from "./successful-query";

export type CanReferToAttorneyClaimInput = {
  /** Null until Phase 8 scoring runs; only `ineligible` blocks referral. */
  claim_strength: ClaimStrengthGate | null;
};

export type CanReferToAttorneySubjectInput = {
  is_exempt: boolean;
  company_identified: boolean;
  call_category: string | null;
};

export type CanReferToAttorneyResult = {
  ok: boolean;
  reasons: AttorneyReferralBlockReason[];
};

/**
 * Whether the user may be offered attorney referral for this subject.
 */
export function canReferToAttorney(
  claim: CanReferToAttorneyClaimInput,
  subject: CanReferToAttorneySubjectInput,
): CanReferToAttorneyResult {
  const reasons: AttorneyReferralBlockReason[] = [];

  if (subject.is_exempt) {
    reasons.push(ATTORNEY_REFERRAL_REASON_EXEMPT);
  }

  if (claim.claim_strength === "ineligible") {
    reasons.push(ATTORNEY_REFERRAL_REASON_CLAIM_INELIGIBLE);
  }

  if (
    isTcpaLetterBlockedForUnidentifiedCompany({
      companyIdentified: subject.company_identified,
      isExempt: subject.is_exempt,
    })
  ) {
    reasons.push(ATTORNEY_REFERRAL_REASON_COMPANY_UNIDENTIFIED);
  }

  if (isTcpaLetterBlockedForCallCategory(subject.call_category)) {
    reasons.push(ATTORNEY_REFERRAL_REASON_FDCPA_DEBT_COLLECTION);
  }

  return { ok: reasons.length === 0, reasons };
}

/** Server routes: throw when referral must be rejected (§6.6.2). */
export class AttorneyReferralNotAllowedError extends Error {
  readonly reasons: AttorneyReferralBlockReason[];

  constructor(reasons: AttorneyReferralBlockReason[]) {
    super(`Attorney referral not allowed: ${reasons.join(", ")}`);
    this.name = "AttorneyReferralNotAllowedError";
    this.reasons = reasons;
  }
}

export function assertCanReferToAttorney(
  claim: CanReferToAttorneyClaimInput,
  subject: CanReferToAttorneySubjectInput,
): void {
  const result = canReferToAttorney(claim, subject);
  if (!result.ok) {
    throw new AttorneyReferralNotAllowedError(result.reasons);
  }
}

/**
 * @deprecated DIY demand letters removed from v0.1 — use {@link canReferToAttorney}.
 */
export function canPurchaseLetter(
  claim: CanReferToAttorneyClaimInput,
  subject: CanReferToAttorneySubjectInput,
): CanReferToAttorneyResult {
  return canReferToAttorney(claim, subject);
}
