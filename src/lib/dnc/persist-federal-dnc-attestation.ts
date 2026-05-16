/**
 * Phase 6.2 — Persist user-attested federal DNC to `dnc_check_results` + `claim_events`.
 */

import type { ClaimEventSource } from "@/lib/constants/claimEvent";
import { FEDERAL_DNC_CONFIRMATION_SCREENSHOT_METADATA_KEY } from "@/lib/dnc/federal-dnc-evidence";
import { computeFederalDncEligibleFromDates } from "@/lib/dnc/federal-dnc-eligibility";
import { resolveFederalDncMatrixSignal } from "@/lib/scoring/federal-dnc-matrix-signal";
import type { Database, Json } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { FederalDncAttestationInput } from "./federal-dnc-attestation-gate";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

const DNC_CHECK_EVENT = "dnc_check" as const;
const USER_INPUT_SOURCE: ClaimEventSource = "user_input";

export type PersistFederalDncAttestationParams = {
  claimId: string;
  claimSubjectId: string;
  phoneNumberNormalized: string;
  attestation: FederalDncAttestationInput;
  /**
   * When set (e.g. from qualification Q10), recomputes `federal_dnc_eligible`.
   * Omit until earliest/most-recent call date is known.
   */
  earliestCallDate?: string | null;
  /** §6.2.4 — private Storage object path (not a public URL). */
  confirmationScreenshotPath?: string | null;
};

export type PersistFederalDncAttestationResult = {
  federalDncEligible: boolean | null;
  matrixTier: string;
  matrixPoints: number;
};

/**
 * Derives eligibility: false when not registered; null when registered but no call date yet.
 */
export function resolveFederalDncEligibleFromAttestation(
  attestation: FederalDncAttestationInput,
  earliestCallDate?: string | null,
): boolean | null {
  if (!attestation.federalDncRegistered) {
    return false;
  }
  if (!attestation.federalDncRegistrationDate) {
    return null;
  }
  if (!earliestCallDate?.trim()) {
    return null;
  }
  return computeFederalDncEligibleFromDates(
    attestation.federalDncRegistrationDate,
    earliestCallDate,
  );
}

function buildDncClaimEventRows(
  claimId: string,
  attestation: FederalDncAttestationInput,
  federalDncEligible: boolean | null,
  matrix: ReturnType<typeof resolveFederalDncMatrixSignal>,
  confirmationScreenshotPath?: string | null,
): Database["public"]["Tables"]["claim_events"]["Insert"][] {
  const rows: Database["public"]["Tables"]["claim_events"]["Insert"][] = [
    {
      claim_id: claimId,
      event_type: DNC_CHECK_EVENT,
      key: "federal_dnc_registered",
      value: String(attestation.federalDncRegistered),
      source: USER_INPUT_SOURCE,
    },
    {
      claim_id: claimId,
      event_type: DNC_CHECK_EVENT,
      key: "attested_by_user",
      value: "true",
      source: USER_INPUT_SOURCE,
    },
    {
      claim_id: claimId,
      event_type: DNC_CHECK_EVENT,
      key: "federal_dnc_matrix_tier",
      value: matrix.tier,
      source: USER_INPUT_SOURCE,
    },
    {
      claim_id: claimId,
      event_type: DNC_CHECK_EVENT,
      key: "federal_dnc_matrix_points",
      value: String(matrix.points),
      source: USER_INPUT_SOURCE,
    },
  ];

  if (attestation.federalDncRegistrationDate) {
    rows.push({
      claim_id: claimId,
      event_type: DNC_CHECK_EVENT,
      key: "federal_dnc_registration_date",
      value: attestation.federalDncRegistrationDate,
      source: USER_INPUT_SOURCE,
    });
  }

  if (federalDncEligible !== null) {
    rows.push({
      claim_id: claimId,
      event_type: DNC_CHECK_EVENT,
      key: "federal_dnc_eligible",
      value: String(federalDncEligible),
      source: USER_INPUT_SOURCE,
    });
  }

  if (confirmationScreenshotPath) {
    rows.push({
      claim_id: claimId,
      event_type: DNC_CHECK_EVENT,
      key: "federal_dnc_confirmation_screenshot_path",
      value: confirmationScreenshotPath,
      source: USER_INPUT_SOURCE,
    });
  }

  return rows;
}

/**
 * Upserts `dnc_check_results` for the subject and appends attestation `claim_events`.
 */
export async function persistFederalDncAttestation(
  supabase: SupabaseClient<Database>,
  params: PersistFederalDncAttestationParams,
): Promise<PersistFederalDncAttestationResult> {
  const federalDncEligible = resolveFederalDncEligibleFromAttestation(
    params.attestation,
    params.earliestCallDate,
  );

  const matrix = resolveFederalDncMatrixSignal({
    attestedByUser: true,
    federalDncEligible: federalDncEligible === true,
  });

  const now = new Date().toISOString();

  const row: Database["public"]["Tables"]["dnc_check_results"]["Insert"] = {
    claim_id: params.claimId,
    claim_subject_id: params.claimSubjectId,
    phone_number_normalized: params.phoneNumberNormalized,
    federal_dnc_registered: params.attestation.federalDncRegistered,
    federal_dnc_registration_date: params.attestation.federalDncRegistrationDate,
    federal_dnc_eligible: federalDncEligible,
    federal_dnc_checked_at: now,
  };

  const { data: existing, error: loadError } = await supabase
    .from("dnc_check_results")
    .select("id")
    .eq("claim_subject_id", params.claimSubjectId)
    .maybeSingle();

  if (loadError) {
    throw loadError;
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("dnc_check_results")
      .update({
        federal_dnc_registered: row.federal_dnc_registered,
        federal_dnc_registration_date: row.federal_dnc_registration_date,
        federal_dnc_eligible: row.federal_dnc_eligible,
        federal_dnc_checked_at: row.federal_dnc_checked_at,
      })
      .eq("id", existing.id);

    if (updateError) {
      throw updateError;
    }
  } else {
    const { error: insertError } = await supabase
      .from("dnc_check_results")
      .insert(row);

    if (insertError) {
      throw insertError;
    }
  }

  if (params.confirmationScreenshotPath) {
    const { data: subjectRow, error: metaLoadError } = await supabase
      .from("claim_subjects")
      .select("metadata")
      .eq("id", params.claimSubjectId)
      .maybeSingle();

    if (metaLoadError) {
      throw metaLoadError;
    }

    const priorMeta = isRecord(subjectRow?.metadata) ? subjectRow.metadata : {};
    const metadata: Json = {
      ...priorMeta,
      [FEDERAL_DNC_CONFIRMATION_SCREENSHOT_METADATA_KEY]:
        params.confirmationScreenshotPath,
    };

    const { error: metaUpdateError } = await supabase
      .from("claim_subjects")
      .update({ metadata })
      .eq("id", params.claimSubjectId);

    if (metaUpdateError) {
      throw metaUpdateError;
    }
  }

  const eventRows = buildDncClaimEventRows(
    params.claimId,
    params.attestation,
    federalDncEligible,
    matrix,
    params.confirmationScreenshotPath,
  );

  const { error: eventsError } = await supabase
    .from("claim_events")
    .insert(eventRows);

  if (eventsError) {
    throw eventsError;
  }

  return {
    federalDncEligible,
    matrixTier: matrix.tier,
    matrixPoints: matrix.points,
  };
}
