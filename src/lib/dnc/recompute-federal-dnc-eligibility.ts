/**
 * Phase 6.2.2 — Recompute federal DNC eligibility when qualification supplies call dates.
 */

import { resolveFederalDncEligibleFromAttestation } from "@/lib/dnc/persist-federal-dnc-attestation";
import { resolveFederalDncMatrixSignal } from "@/lib/scoring/federal-dnc-matrix-signal";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { FederalDncAttestationInput } from "./federal-dnc-attestation-gate";

const DNC_CHECK_EVENT = "dnc_check" as const;

export type RecomputeFederalDncEligibilityParams = {
  claimId: string;
  claimSubjectId: string;
  attestation: FederalDncAttestationInput;
  earliestCallDate: string;
};

/**
 * Updates `dnc_check_results.federal_dnc_eligible` and appends matrix claim_events
 * after earliest (or most-recent) call date is known from qualification.
 */
export async function recomputeFederalDncEligibility(
  supabase: SupabaseClient<Database>,
  params: RecomputeFederalDncEligibilityParams,
): Promise<{ federalDncEligible: boolean | null; matrixPoints: number }> {
  const federalDncEligible = resolveFederalDncEligibleFromAttestation(
    params.attestation,
    params.earliestCallDate,
  );

  const matrix = resolveFederalDncMatrixSignal({
    attestedByUser: true,
    federalDncEligible: federalDncEligible === true,
  });

  const { error: updateError } = await supabase
    .from("dnc_check_results")
    .update({
      federal_dnc_eligible: federalDncEligible,
      federal_dnc_checked_at: new Date().toISOString(),
    })
    .eq("claim_subject_id", params.claimSubjectId);

  if (updateError) {
    throw updateError;
  }

  const eventRows: Database["public"]["Tables"]["claim_events"]["Insert"][] = [
    {
      claim_id: params.claimId,
      event_type: DNC_CHECK_EVENT,
      key: "federal_dnc_eligible",
      value: String(federalDncEligible ?? false),
      source: "user_input",
    },
    {
      claim_id: params.claimId,
      event_type: DNC_CHECK_EVENT,
      key: "federal_dnc_matrix_tier",
      value: matrix.tier,
      source: "user_input",
    },
    {
      claim_id: params.claimId,
      event_type: DNC_CHECK_EVENT,
      key: "federal_dnc_matrix_points",
      value: String(matrix.points),
      source: "user_input",
    },
  ];

  const { error: eventsError } = await supabase
    .from("claim_events")
    .insert(eventRows);

  if (eventsError) {
    throw eventsError;
  }

  return { federalDncEligible, matrixPoints: matrix.points };
}
