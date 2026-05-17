/**
 * Phase 7.7.2 — Load per-subject attorney referral eligibility for `/results`.
 */

import {
  canReferToAttorney,
  type CanReferToAttorneyResult,
} from "@/lib/claims/can-refer-to-attorney";
import type { ClaimStrengthGate } from "@/lib/claims/successful-query";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ResultsSubjectReferralRow = {
  subjectId: string;
  phoneNumber: string | null;
  referral: CanReferToAttorneyResult;
};

export type ResultsAttorneyReferralContext = {
  claimId: string;
  claimStrength: ClaimStrengthGate | null;
  subjects: ResultsSubjectReferralRow[];
  /** True when at least one subject passes {@link canReferToAttorney}. */
  anyCanRefer: boolean;
};

/**
 * Loads referral gates for an owned claim (authenticated RLS).
 */
export async function loadResultsAttorneyReferral(
  supabase: SupabaseClient<Database>,
  params: { claimId: string; userId: string },
): Promise<ResultsAttorneyReferralContext | null> {
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

  const { data: subjects, error: subjectsError } = await supabase
    .from("claim_subjects")
    .select("id, phone_number, is_exempt, company_identified, call_category")
    .eq("claim_id", claim.id);

  if (subjectsError) {
    throw subjectsError;
  }

  const claimInput = {
    claim_strength: claim.claim_strength as ClaimStrengthGate | null,
  };

  const rows: ResultsSubjectReferralRow[] = (subjects ?? []).map((subject) => ({
    subjectId: subject.id,
    phoneNumber: subject.phone_number,
    referral: canReferToAttorney(claimInput, {
      is_exempt: subject.is_exempt,
      company_identified: subject.company_identified,
      call_category: subject.call_category,
    }),
  }));

  return {
    claimId: claim.id,
    claimStrength: claim.claim_strength as ClaimStrengthGate | null,
    subjects: rows,
    anyCanRefer: rows.some((row) => row.referral.ok),
  };
}
