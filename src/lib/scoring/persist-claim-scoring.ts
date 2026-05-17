/**
 * Phase 8.5 — Persist claim strength, valuation cents, and `value_calculated` audit rows.
 */

import type { ClaimEventSource } from "@/lib/constants/claimEvent";
import type { ClaimStrengthGate } from "@/lib/claims/successful-query";
import { loadQualifyScreen1Answers } from "@/lib/qualify/screen-1-consent";
import { loadQualifyScreen2Answers } from "@/lib/qualify/screen-2-stop-request";
import { loadQualifyScreen3Answers } from "@/lib/qualify/screen-3-call-details";
import { SCORING_STATUS_EVENT_KEY } from "@/lib/qualify/complete-qualify-claim";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import { computeClaimScoring } from "./compute-claim-scoring";
import { loadSolFlags } from "./load-sol-flags";
import type { DncRowForStrength } from "./build-strength-matrix-input";
import {
  CLAIM_STRENGTH_AGGREGATE_METHOD,
  SCORING_CLAIM_EVENT_KEYS,
  SCORING_VALUE_CALCULATED_EVENT,
} from "./scoring-claim-events";
import type { ClaimScoringResult } from "./compute-claim-scoring";

const SYSTEM_SOURCE: ClaimEventSource = "system";

export const SCORING_STATUS_COMPLETE = "complete" as const;

export type PersistClaimScoringResult = {
  persisted: boolean;
  scoring: ClaimScoringResult | null;
};

function valueCalculatedRow(
  claimId: string,
  key: string,
  value: string,
): Database["public"]["Tables"]["claim_events"]["Insert"] {
  return {
    claim_id: claimId,
    event_type: SCORING_VALUE_CALCULATED_EVENT,
    key,
    value,
    source: SYSTEM_SOURCE,
  };
}

function buildScoringClaimEventRows(
  claimId: string,
  scoring: ClaimScoringResult,
): Database["public"]["Tables"]["claim_events"]["Insert"][] {
  const rows: Database["public"]["Tables"]["claim_events"]["Insert"][] = [
    valueCalculatedRow(
      claimId,
      SCORING_CLAIM_EVENT_KEYS.claimStrength,
      scoring.claimStrength,
    ),
    valueCalculatedRow(
      claimId,
      SCORING_CLAIM_EVENT_KEYS.claimStrengthScore,
      String(scoring.claimStrengthScore),
    ),
    valueCalculatedRow(
      claimId,
      SCORING_CLAIM_EVENT_KEYS.aggregateMethod,
      CLAIM_STRENGTH_AGGREGATE_METHOD,
    ),
  ];

  if (scoring.valuation) {
    const v = scoring.valuation;
    rows.push(
      valueCalculatedRow(
        claimId,
        SCORING_CLAIM_EVENT_KEYS.estimatedValueLowCents,
        String(v.conservativeLowCents),
      ),
      valueCalculatedRow(
        claimId,
        SCORING_CLAIM_EVENT_KEYS.estimatedValueHighCents,
        String(v.conservativeHighCents),
      ),
      valueCalculatedRow(
        claimId,
        SCORING_CLAIM_EVENT_KEYS.estimatedValueRealisticCents,
        String(v.realisticCents),
      ),
      valueCalculatedRow(
        claimId,
        SCORING_CLAIM_EVENT_KEYS.estimatedValueMaximumCents,
        String(v.maximumCents),
      ),
      valueCalculatedRow(
        claimId,
        SCORING_CLAIM_EVENT_KEYS.standardViolationCount,
        String(v.standardViolationCount),
      ),
      valueCalculatedRow(
        claimId,
        SCORING_CLAIM_EVENT_KEYS.willfulViolationCount,
        String(v.willfulViolationCount),
      ),
      valueCalculatedRow(
        claimId,
        SCORING_CLAIM_EVENT_KEYS.timeViolationCount,
        String(v.timeViolationCount),
      ),
    );
  }

  const snapshots = scoring.subjects.map((subject) => ({
    subjectId: subject.subjectId,
    strength: subject.strength,
    totalScore: subject.matrix.totalScore,
    exemptOverride: subject.matrix.exemptOverride,
    breakdown: subject.matrix.breakdown,
  }));

  rows.push(
    valueCalculatedRow(
      claimId,
      SCORING_CLAIM_EVENT_KEYS.subjectMatrixSnapshots,
      JSON.stringify(snapshots),
    ),
  );

  return rows;
}

function claimsUpdateFromScoring(
  scoring: ClaimScoringResult,
): Database["public"]["Tables"]["claims"]["Update"] {
  const update: Database["public"]["Tables"]["claims"]["Update"] = {
    claim_strength: scoring.claimStrength,
  };

  if (scoring.valuation) {
    update.estimated_value_low_cents = scoring.valuation.conservativeLowCents;
    update.estimated_value_high_cents = scoring.valuation.conservativeHighCents;
    update.estimated_value_realistic_cents = scoring.valuation.realisticCents;
  }

  return update;
}

/**
 * Computes scoring for a claim and writes `claims` + `claim_events` when not yet persisted.
 * Idempotent when `claims.claim_strength` is already set.
 */
export async function persistClaimScoring(
  supabase: SupabaseClient<Database>,
  params: { claimId: string },
): Promise<PersistClaimScoringResult> {
  const { claimId } = params;

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("id, claim_strength")
    .eq("id", claimId)
    .maybeSingle();

  if (claimError) {
    throw claimError;
  }

  if (!claim?.id) {
    throw new Error("Claim not found");
  }

  if (claim.claim_strength !== null) {
    return { persisted: false, scoring: null };
  }

  const [subjectsResult, dncResult, screen1, screen2, screen3, sol] =
    await Promise.all([
      supabase
        .from("claim_subjects")
        .select(
          "id, is_exempt, company_identified, registered_agent_name, spam_db_confidence_score",
        )
        .eq("claim_id", claimId),
      supabase
        .from("dnc_check_results")
        .select(
          "claim_subject_id, federal_dnc_registered, federal_dnc_eligible, state_dnc_applicable, state_dnc_registered",
        )
        .eq("claim_id", claimId),
      loadQualifyScreen1Answers(supabase, claimId),
      loadQualifyScreen2Answers(supabase, claimId),
      loadQualifyScreen3Answers(supabase, claimId),
      loadSolFlags(supabase, claimId),
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

  const scoring = computeClaimScoring({
    subjects: subjectsResult.data ?? [],
    dncBySubject,
    screen1,
    screen2,
    screen3,
    sol,
  });

  const { error: updateError } = await supabase
    .from("claims")
    .update(claimsUpdateFromScoring(scoring))
    .eq("id", claimId);

  if (updateError) {
    throw updateError;
  }

  const eventRows: Database["public"]["Tables"]["claim_events"]["Insert"][] = [
    ...buildScoringClaimEventRows(claimId, scoring),
    {
      claim_id: claimId,
      event_type: "qualification_answer",
      key: SCORING_STATUS_EVENT_KEY,
      value: SCORING_STATUS_COMPLETE,
      source: SYSTEM_SOURCE,
    },
  ];

  const { error: insertError } = await supabase.from("claim_events").insert(eventRows);
  if (insertError) {
    throw insertError;
  }

  return { persisted: true, scoring };
}

/**
 * Ensures scoring columns are populated (backfill for claims qualified before §8.5).
 */
export async function ensureClaimScoringPersisted(
  supabase: SupabaseClient<Database>,
  params: { claimId: string; claimStrength: ClaimStrengthGate },
): Promise<void> {
  if (params.claimStrength !== null) {
    return;
  }

  await persistClaimScoring(supabase, { claimId: params.claimId });
}
