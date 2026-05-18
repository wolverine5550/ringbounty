/**
 * Load a prior federal DNC attestation for the same account (any claim).
 *
 * Registry status applies to the consumer's receiving line, not spammer numbers
 * screened on `/check`. Reuse is keyed by `user_id`, not `claim_subjects` phone.
 */

import { getFederalDncScreenshotPathFromMetadata } from "@/lib/dnc/federal-dnc-evidence";
import type { FederalDncAttestationInput } from "@/lib/dnc/federal-dnc-attestation-gate";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PriorFederalDncAttestation = {
  attestation: FederalDncAttestationInput;
  confirmationScreenshotPath: string | null;
  sourceClaimSubjectId: string;
};

/**
 * Returns the most recent completed federal DNC attestation for this user,
 * excluding the current claim subject.
 */
export async function loadPriorFederalDncAttestationForUser(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    excludeClaimSubjectId: string;
  },
): Promise<PriorFederalDncAttestation | null> {
  const { data: claims, error: claimsError } = await supabase
    .from("claims")
    .select("id")
    .eq("user_id", params.userId);

  if (claimsError) {
    throw claimsError;
  }

  const claimIds = (claims ?? []).map((c) => c.id).filter(Boolean);
  if (claimIds.length === 0) {
    return null;
  }

  const { data: subjects, error: subjectsError } = await supabase
    .from("claim_subjects")
    .select("id, metadata")
    .in("claim_id", claimIds)
    .neq("id", params.excludeClaimSubjectId);

  if (subjectsError) {
    throw subjectsError;
  }

  const subjectIds = (subjects ?? []).map((s) => s.id).filter(Boolean);
  if (subjectIds.length === 0) {
    return null;
  }

  const { data: dncRows, error: dncError } = await supabase
    .from("dnc_check_results")
    .select(
      "claim_subject_id, federal_dnc_registered, federal_dnc_registration_date, federal_dnc_checked_at",
    )
    .in("claim_subject_id", subjectIds)
    .not("federal_dnc_registered", "is", null)
    .order("federal_dnc_checked_at", { ascending: false })
    .limit(1);

  if (dncError) {
    throw dncError;
  }

  const row = dncRows?.[0];
  if (
    !row?.claim_subject_id ||
    row.federal_dnc_registered === null ||
    row.federal_dnc_registered === undefined
  ) {
    return null;
  }

  const subject = (subjects ?? []).find((s) => s.id === row.claim_subject_id);

  return {
    attestation: {
      federalDncRegistered: row.federal_dnc_registered,
      federalDncRegistrationDate: row.federal_dnc_registration_date,
    },
    confirmationScreenshotPath: getFederalDncScreenshotPathFromMetadata(
      subject?.metadata,
    ),
    sourceClaimSubjectId: row.claim_subject_id,
  };
}
