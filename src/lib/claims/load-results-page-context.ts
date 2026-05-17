/**
 * Phase 8.4 — Load scoring, valuation, referral, and email-capture context for `/results`.
 */

import {
  canReferToAttorney,
  type CanReferToAttorneyResult,
} from "@/lib/claims/can-refer-to-attorney";
import { getEmailCaptureTrigger } from "@/lib/claims/email-capture-trigger";
import type { ClaimStrengthGate } from "@/lib/claims/successful-query";
import { getResultsStrengthDisplay } from "@/lib/constants/results-strength";
import { loadQualifyScreen1Answers } from "@/lib/qualify/screen-1-consent";
import { loadQualifyScreen2Answers } from "@/lib/qualify/screen-2-stop-request";
import { loadQualifyScreen3Answers } from "@/lib/qualify/screen-3-call-details";
import {
  aggregateClaimStrength,
  resolveEffectiveClaimStrength,
} from "@/lib/scoring/aggregate-claim-strength";
import {
  buildStrengthMatrixInput,
  type DncRowForStrength,
} from "@/lib/scoring/build-strength-matrix-input";
import { buildViolationCountInput } from "@/lib/scoring/compute-violation-counts";
import {
  computeValuation,
  type ValuationScenarios,
} from "@/lib/scoring/compute-valuation";
import { loadSolFlags } from "@/lib/scoring/load-sol-flags";
import type { PersistedSolFlags } from "@/lib/scoring/sol-claim-events";
import {
  buildDncSummary,
  buildSpamSummary,
} from "@/lib/scoring/subject-evidence-summaries";
import {
  computeStrengthMatrix,
  type StrengthMatrixStrength,
} from "@/lib/scoring/strength-matrix";
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
  effectiveClaimStrength: ClaimStrengthGate;
  strengthDisplay: ReturnType<typeof getResultsStrengthDisplay>;
  valuation: ValuationScenarios | null;
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
    .select("id, user_id, claim_strength")
    .eq("id", params.claimId)
    .maybeSingle();

  if (claimError) {
    throw claimError;
  }

  if (!claim?.id || claim.user_id !== params.userId) {
    return null;
  }

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

  const persistedStrength = claim.claim_strength as ClaimStrengthGate;
  const perSubjectStrengths: StrengthMatrixStrength[] = [];

  const subjectRows = subjectsResult.data ?? [];

  for (const subject of subjectRows) {
    const matrix = computeStrengthMatrix(
      buildStrengthMatrixInput({
        subject,
        screen1,
        screen2,
        screen3,
        dnc: dncBySubject.get(subject.id) ?? null,
        sol,
      }),
    );
    perSubjectStrengths.push(matrix.strength);
  }

  const effectiveClaimStrength = resolveEffectiveClaimStrength({
    persisted: persistedStrength,
    computed: aggregateClaimStrength(perSubjectStrengths),
  });

  const claimInput = { claim_strength: effectiveClaimStrength };

  const subjects: ResultsSubjectView[] = subjectRows.map((subject, index) => {
    const matrix = computeStrengthMatrix(
      buildStrengthMatrixInput({
        subject,
        screen1,
        screen2,
        screen3,
        dnc: dncBySubject.get(subject.id) ?? null,
        sol,
      }),
    );

    return {
      subjectId: subject.id,
      phoneNumber: subject.phone_number,
      companyName: subject.company_name,
      isExempt: subject.is_exempt,
      exemptReason: subject.exempt_reason,
      spamSummary: buildSpamSummary(subject),
      dncSummary: buildDncSummary(dncBySubject.get(subject.id) ?? null),
      strength: perSubjectStrengths[index] ?? matrix.strength,
      strengthLabel: getResultsStrengthDisplay(
        perSubjectStrengths[index] ?? matrix.strength,
      ).label,
      referral: canReferToAttorney(claimInput, {
        is_exempt: subject.is_exempt,
        company_identified: subject.company_identified,
        call_category: subject.call_category,
      }),
    };
  });

  const violationInput = buildViolationCountInput(screen2, screen3);
  const valuation = violationInput
    ? computeValuation({
        ...violationInput,
        likelyTimeBarred: sol?.likelyTimeBarred ?? false,
      })
    : null;

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

  return {
    claimId: claim.id,
    effectiveClaimStrength,
    strengthDisplay: getResultsStrengthDisplay(strengthForDisplay),
    valuation,
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
