/**
 * Phase 8.4 — Build {@link StrengthMatrixInput} from persisted claim + subject rows.
 */

import type { QualifyScreen1Answers } from "@/lib/qualify/screen-1-consent";
import type { QualifyScreen2Answers } from "@/lib/qualify/screen-2-stop-request";
import type { QualifyScreen3Answers } from "@/lib/qualify/screen-3-call-details";
import type { PersistedSolFlags } from "@/lib/scoring/sol-claim-events";

import { mergedSpamFromClaimSubject } from "./merged-spam-from-subject";
import type { StrengthMatrixInput } from "./strength-matrix";

export type DncRowForStrength = {
  federal_dnc_registered: boolean | null;
  federal_dnc_eligible: boolean | null;
  state_dnc_applicable: boolean | null;
  state_dnc_registered: boolean | null;
};

export type ClaimSubjectForStrength = {
  is_exempt: boolean;
  company_identified: boolean;
  registered_agent_name: string | null;
  spam_db_confidence_score: number | null;
};

/**
 * One subject row + shared qualification answers → matrix input (§8.1.2).
 */
export function buildStrengthMatrixInput(params: {
  subject: ClaimSubjectForStrength;
  screen1: QualifyScreen1Answers | null;
  screen2: QualifyScreen2Answers | null;
  screen3: QualifyScreen3Answers | null;
  dnc: DncRowForStrength | null;
  sol: PersistedSolFlags | null;
}): StrengthMatrixInput {
  const { subject, screen1, screen2, screen3, dnc, sol } = params;

  const federalAttested =
    dnc?.federal_dnc_registered !== null && dnc?.federal_dnc_registered !== undefined;

  return {
    isExempt: subject.is_exempt,
    mergedSpam: mergedSpamFromClaimSubject(subject),
    federalDncEligible: dnc?.federal_dnc_eligible ?? null,
    attestedFederalDncByUser: federalAttested,
    stateDncApplicable: dnc?.state_dnc_applicable ?? null,
    stateDncRegistered: dnc?.state_dnc_registered ?? null,
    stopRequestMade: screen2?.stopRequestMade,
    callsAfterStopRequest: screen2?.callsAfterStopRequest ?? null,
    callsBefore8am: screen3?.callsBefore8am,
    callsAfter9pm: screen3?.callsAfter9pm,
    callCountTotal: screen3?.callCountTotal ?? null,
    companyIdentified: subject.company_identified,
    registeredAgentFound: Boolean(subject.registered_agent_name?.trim()),
    withinFederalSol: sol?.withinFederalSol ?? null,
    withinStateSol: sol?.withinStateSol ?? null,
    gaveDirectConsent: screen1?.gaveDirectConsent ?? null,
    hasExistingRelationship: screen1?.hasExistingRelationship ?? null,
    thirdPartyConsentPossible: screen1?.thirdPartyConsentPossible ?? null,
  };
}
