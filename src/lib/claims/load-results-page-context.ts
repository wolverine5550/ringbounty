/**
 * Phase 8.4 — Load scoring, valuation, referral, and email-capture context for `/results`.
 */

import {
  canReferToAttorney,
  type CanReferToAttorneyResult,
} from "@/lib/claims/can-refer-to-attorney";
import {
  buildResultsQualifyHref,
  isClaimQualifiedForAttorneyPath,
  pickResultsQualifySubjectId,
} from "@/lib/claims/results-qualify-gate";
import { getEmailCaptureTrigger } from "@/lib/claims/email-capture-trigger";
import type { ClaimStrengthGate } from "@/lib/claims/successful-query";
import { getResultsStrengthDisplay } from "@/lib/constants/results-strength";
import { loadQualifyScreen1Answers } from "@/lib/qualify/screen-1-consent";
import { loadQualifyScreen2Answers } from "@/lib/qualify/screen-2-stop-request";
import { loadQualifyScreen3Answers } from "@/lib/qualify/screen-3-call-details";
import { resolveEffectiveClaimStrength } from "@/lib/scoring/aggregate-claim-strength";
import { computeClaimScoring } from "@/lib/scoring/compute-claim-scoring";
import type { DncRowForStrength } from "@/lib/scoring/build-strength-matrix-input";
import { ensureClaimScoringPersisted } from "@/lib/scoring/persist-claim-scoring";
import { loadSolFlags } from "@/lib/scoring/load-sol-flags";
import type { PersistedSolFlags } from "@/lib/scoring/sol-claim-events";
import {
  buildDncSummary,
  buildSpamSummary,
} from "@/lib/scoring/subject-evidence-summaries";
import type { StrengthMatrixStrength } from "@/lib/scoring/strength-matrix";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ResultsSubjectView = {
  subjectId: string;
  phoneNumber: string | null;
  companyName: string | null;
  isExempt: boolean;
  exemptReason: string | null;
  spamSummary: string;
  dncSummary: string;
  strength: StrengthMatrixStrength;
  strengthLabel: string;
  referral: CanReferToAttorneyResult;
};

export type ResultsPageContext = {
  claimId: string;
  /** `qualified` after wizard step 6; attorney CTA only when true. */
  claimStatus: string;
  isQualificationComplete: boolean;
  /** Set when user still needs the qualify wizard. */
  qualifyHref: string | null;
  effectiveClaimStrength: ClaimStrengthGate;
  strengthDisplay: ReturnType<typeof getResultsStrengthDisplay>;
  valuation: ReturnType<typeof computeClaimScoring>["valuation"];
  subjects: ResultsSubjectView[];
  anyCanRefer: boolean;
  ineligibleReasons: string[];
  showEmailCapture: boolean;
  emailCaptureReason: ReturnType<typeof getEmailCaptureTrigger>["emailCaptureReason"];
  sol: PersistedSolFlags | null;
};

const INELIGIBLE_CLAIM_REASON =
  "Overall claim strength is below our TCPA screening threshold based on your answers.";

function collectIneligibleReasons(params: {
  effectiveStrength: ClaimStrengthGate;
  subjects: ResultsSubjectView[];
}): string[] {
  const reasons = new Set<string>();

  if (params.effectiveStrength === "ineligible") {
    reasons.add(INELIGIBLE_CLAIM_REASON);
  }

  for (const subject of params.subjects) {
    if (subject.isExempt) {
      reasons.add("At least one number is marked exempt from TCPA screening.");
    }
    for (const code of subject.referral.reasons) {
      if (code === "claim_ineligible") {
        continue;
      }
      if (code === "exempt") {
        reasons.add("Exempt call category on one or more numbers.");
      } else if (code === "company_unidentified") {
        reasons.add("Company was not identified during qualification.");
      } else if (code === "fdcpa_debt_collection") {
        reasons.add("Debt collection calls are not eligible for TCPA attorney referral here.");
      }
    }
  }

  return [...reasons];
}

/**
 * Loads `/results` view model for an owned claim (authenticated RLS).
 */
export async function loadResultsPageContext(
  supabase: SupabaseClient<Database>,
  params: { claimId: string; userId: string },
): Promise<ResultsPageContext | null> {
  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("id, user_id, claim_strength, status")
    .eq("id", params.claimId)
    .maybeSingle();

  if (claimError) {
    throw claimError;
  }

  if (!claim?.id || claim.user_id !== params.userId) {
    return null;
  }

  const persistedStrength = claim.claim_strength as ClaimStrengthGate;

  await ensureClaimScoringPersisted(supabase, {
    claimId: claim.id,
    claimStrength: persistedStrength,
  });

  const { data: claimAfterScoring, error: claimReloadError } = await supabase
    .from("claims")
    .select("claim_strength")
    .eq("id", claim.id)
    .maybeSingle();

  if (claimReloadError) {
    throw claimReloadError;
  }

  const claimStrengthAfterPersist =
    (claimAfterScoring?.claim_strength as ClaimStrengthGate) ?? persistedStrength;

  const [subjectsResult, dncResult, screen1, screen2, screen3, sol] =
    await Promise.all([
      supabase
        .from("claim_subjects")
        .select(
          "id, phone_number, company_name, company_identified, is_exempt, exempt_reason, call_category, spam_db_confidence_score, registered_agent_name",
        )
        .eq("claim_id", claim.id),
      supabase
        .from("dnc_check_results")
        .select(
          "claim_subject_id, federal_dnc_registered, federal_dnc_eligible, state_dnc_applicable, state_dnc_registered",
        )
        .eq("claim_id", claim.id),
      loadQualifyScreen1Answers(supabase, claim.id),
      loadQualifyScreen2Answers(supabase, claim.id),
      loadQualifyScreen3Answers(supabase, claim.id),
      loadSolFlags(supabase, claim.id),
    ]);

  if (subjectsResult.error) {
    throw subjectsResult.error;
  }
  if (dncResult.error) {
    throw dncResult.error;
  }

  const dncBySubject = new Map<string, DncRowForStrength>();
  for (const row of dncResult.data ?? []) {
    if (row.claim_subject_id) {
      dncBySubject.set(row.claim_subject_id, row);
    }
  }

  const subjectRows = subjectsResult.data ?? [];
  const scoring = computeClaimScoring({
    subjects: subjectRows,
    dncBySubject,
    screen1,
    screen2,
    screen3,
    sol,
  });

  const effectiveClaimStrength = resolveEffectiveClaimStrength({
    persisted: claimStrengthAfterPersist,
    computed: scoring.claimStrength,
  });

  const claimInput = { claim_strength: effectiveClaimStrength };

  const subjects: ResultsSubjectView[] = scoring.subjects.map((subjectScoring) => {
    const subject = subjectRows.find((s) => s.id === subjectScoring.subjectId);
    if (!subject) {
      throw new Error("Subject row missing after scoring");
    }

    return {
      subjectId: subject.id,
      phoneNumber: subject.phone_number,
      companyName: subject.company_name,
      isExempt: subject.is_exempt,
      exemptReason: subject.exempt_reason,
      spamSummary: buildSpamSummary(subject),
      dncSummary: buildDncSummary(dncBySubject.get(subject.id) ?? null),
      strength: subjectScoring.strength,
      strengthLabel: getResultsStrengthDisplay(subjectScoring.strength).label,
      referral: canReferToAttorney(claimInput, {
        is_exempt: subject.is_exempt,
        company_identified: subject.company_identified,
        call_category: subject.call_category,
      }),
    };
  });

  const emailCapture = getEmailCaptureTrigger({
    claim: { claim_strength: effectiveClaimStrength },
    subjects: subjectRows.map((s) => ({
      is_exempt: s.is_exempt,
      call_category: s.call_category,
      spam_db_complaint_count: null,
    })),
  });

  const strengthForDisplay = (effectiveClaimStrength ??
    "ineligible") as StrengthMatrixStrength;

  const claimStatus = claim.status;
  const isQualificationComplete = isClaimQualifiedForAttorneyPath(claimStatus);
  const qualifySubjectId = pickResultsQualifySubjectId(
    subjects.map((s) => ({ subjectId: s.subjectId, isExempt: s.isExempt })),
  );
  const qualifyHref =
    !isQualificationComplete && qualifySubjectId
      ? buildResultsQualifyHref({
          claimId: claim.id,
          subjectId: qualifySubjectId,
        })
      : null;

  return {
    claimId: claim.id,
    claimStatus,
    isQualificationComplete,
    qualifyHref,
    effectiveClaimStrength,
    strengthDisplay: getResultsStrengthDisplay(strengthForDisplay),
    valuation:
      effectiveClaimStrength === "ineligible" ? null : scoring.valuation,
    subjects,
    anyCanRefer: subjects.some((s) => s.referral.ok),
    ineligibleReasons: collectIneligibleReasons({
      effectiveStrength: effectiveClaimStrength,
      subjects,
    }),
    showEmailCapture: emailCapture.showEmailCapture,
    emailCaptureReason: emailCapture.emailCaptureReason,
    sol,
  };
}
