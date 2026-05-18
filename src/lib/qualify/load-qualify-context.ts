/**
 * Phase 7.1.2 — Load `claim_subjects` + parent `claims` with ownership check.
 */

import type { ClaimStrengthGate } from "@/lib/claims/successful-query";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isClaimSubjectIdUuid } from "./qualify-step";

export type QualifyClaimContext = {
  id: string;
  user_id: string;
  claim_strength: ClaimStrengthGate | null;
};

export type QualifySubjectContext = {
  id: string;
  claim_id: string;
  phone_number: string | null;
  phone_number_normalized: string | null;
  metadata: Database["public"]["Tables"]["claim_subjects"]["Row"]["metadata"];
  is_exempt: boolean;
  company_identified: boolean;
  company_name: string | null;
  call_category: string | null;
};

export type QualifyPageContext = {
  subject: QualifySubjectContext;
  claim: QualifyClaimContext;
};

/**
 * Loads subject and parent claim for an authenticated owner.
 * Returns `null` when the id is invalid, rows are missing, or the claim is not owned.
 */
export async function loadQualifyPageContext(
  supabase: SupabaseClient<Database>,
  params: { claimSubjectId: string; userId: string },
): Promise<QualifyPageContext | null> {
  const claimSubjectId = params.claimSubjectId.trim();
  if (!isClaimSubjectIdUuid(claimSubjectId)) {
    return null;
  }

  const { data: subjectRow, error: subjectError } = await supabase
    .from("claim_subjects")
    .select(
      "id, claim_id, phone_number, phone_number_normalized, metadata, is_exempt, company_identified, company_name, call_category",
    )
    .eq("id", claimSubjectId)
    .maybeSingle();

  if (subjectError) {
    throw subjectError;
  }

  if (!subjectRow?.id || !subjectRow.claim_id) {
    return null;
  }

  const { data: claimRow, error: claimError } = await supabase
    .from("claims")
    .select("id, user_id, claim_strength")
    .eq("id", subjectRow.claim_id)
    .maybeSingle();

  if (claimError) {
    throw claimError;
  }

  if (!claimRow?.id || !claimRow.user_id || claimRow.user_id !== params.userId) {
    return null;
  }

  return {
    subject: {
      id: subjectRow.id,
      claim_id: subjectRow.claim_id,
      phone_number: subjectRow.phone_number,
      phone_number_normalized: subjectRow.phone_number_normalized,
      metadata: subjectRow.metadata,
      is_exempt: subjectRow.is_exempt,
      company_identified: subjectRow.company_identified,
      company_name: subjectRow.company_name,
      call_category: subjectRow.call_category,
    },
    claim: {
      id: claimRow.id,
      user_id: claimRow.user_id,
      claim_strength: claimRow.claim_strength as ClaimStrengthGate | null,
    },
  };
}

/**
 * When `?claim=` is present it must match the subject's parent claim (deep-link safety).
 */
export function claimQueryMatchesSubject(
  claimIdFromQuery: string | null | undefined,
  subjectClaimId: string,
): boolean {
  if (!claimIdFromQuery) {
    return true;
  }
  return claimIdFromQuery.trim() === subjectClaimId;
}
