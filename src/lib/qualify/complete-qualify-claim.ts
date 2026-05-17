/**
 * Phase 7.7.1 — Final qualify submit: mark claim `qualified` and queue scoring for Phase 8.
 */

import type { ClaimEventType } from "@/lib/constants/claimEvent";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

const QUALIFICATION_ANSWER_EVENT: ClaimEventType = "qualification_answer";
const SYSTEM_SOURCE = "system" as const;

/** `claim_events.key` when the user finishes wizard step 5 (§7.7). */
export const QUALIFICATION_COMPLETED_EVENT_KEY = "qualification_completed" as const;

/** `claim_events.key` — Phase 8 matrix reads `pending` and replaces with strength output. */
export const SCORING_STATUS_EVENT_KEY = "scoring_status" as const;

export const SCORING_STATUS_PENDING = "pending" as const;

/** Statuses that advance to `qualified` on wizard completion. */
export const QUALIFY_COMPLETION_SOURCE_STATUSES = ["draft", "checking"] as const;

export type CompleteQualifyClaimResult = {
  statusUpdated: boolean;
  scoringEnqueued: boolean;
};

function qualificationEventRow(
  claimId: string,
  key: string,
  value: string,
): Database["public"]["Tables"]["claim_events"]["Insert"] {
  return {
    claim_id: claimId,
    event_type: QUALIFICATION_ANSWER_EVENT,
    key,
    value,
    source: SYSTEM_SOURCE,
  };
}

async function hasClaimEventKey(
  supabase: SupabaseClient<Database>,
  claimId: string,
  key: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("claim_events")
    .select("id")
    .eq("claim_id", claimId)
    .eq("event_type", QUALIFICATION_ANSWER_EVENT)
    .eq("key", key)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.id);
}

/**
 * Sets `claims.status` → `qualified` and records completion + scoring-pending markers.
 */
export async function completeQualifyClaim(
  supabase: SupabaseClient<Database>,
  params: { claimId: string },
): Promise<CompleteQualifyClaimResult> {
  const { claimId } = params;

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("status")
    .eq("id", claimId)
    .maybeSingle();

  if (claimError) {
    throw claimError;
  }

  if (!claim) {
    throw new Error("Claim not found");
  }

  let statusUpdated = false;
  if (
    (QUALIFY_COMPLETION_SOURCE_STATUSES as readonly string[]).includes(claim.status)
  ) {
    const { error: updateError } = await supabase
      .from("claims")
      .update({ status: "qualified" })
      .eq("id", claimId);

    if (updateError) {
      throw updateError;
    }
    statusUpdated = true;
  }

  const rows: Database["public"]["Tables"]["claim_events"]["Insert"][] = [];

  if (!(await hasClaimEventKey(supabase, claimId, QUALIFICATION_COMPLETED_EVENT_KEY))) {
    rows.push(
      qualificationEventRow(
        claimId,
        QUALIFICATION_COMPLETED_EVENT_KEY,
        new Date().toISOString(),
      ),
    );
  }

  let scoringEnqueued = false;
  const hasScoringMarker = await hasClaimEventKey(
    supabase,
    claimId,
    SCORING_STATUS_EVENT_KEY,
  );
  if (!hasScoringMarker) {
    rows.push(
      qualificationEventRow(
        claimId,
        SCORING_STATUS_EVENT_KEY,
        SCORING_STATUS_PENDING,
      ),
    );
    scoringEnqueued = true;
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("claim_events").insert(rows);
    if (insertError) {
      throw insertError;
    }
  }

  return { statusUpdated, scoringEnqueued };
}
