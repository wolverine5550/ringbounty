/**
 * Phase 7.6 — Screen 5 cell vs residential attestation load/persist.
 */

import type { ClaimEventType } from "@/lib/constants/claimEvent";
import {
  isLineType,
  LINE_TYPE_CLAIM_EVENT_KEY,
  type LineType,
} from "@/lib/tcpa/line-type-statute";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import { persistQualifyResumeStep } from "./qualify-step";

const QUALIFICATION_ANSWER_EVENT: ClaimEventType = "qualification_answer";
const USER_INPUT_SOURCE = "user_input" as const;

export type QualifyScreen5Answers = {
  lineType: LineType;
};

/** Validates API body `line_type` (§7.6.2). */
export function parseQualifyLineType(
  value: unknown,
): LineType | { error: string } {
  if (typeof value !== "string") {
    return { error: "line_type must be a string" };
  }
  const trimmed = value.trim();
  if (!isLineType(trimmed)) {
    return { error: "line_type must be mobile or residential" };
  }
  return trimmed;
}

/**
 * Latest Screen 5 attestation for a claim.
 */
export async function loadQualifyScreen5Answers(
  supabase: SupabaseClient<Database>,
  claimId: string,
): Promise<QualifyScreen5Answers | null> {
  const { data, error } = await supabase
    .from("claim_events")
    .select("value")
    .eq("claim_id", claimId)
    .eq("event_type", QUALIFICATION_ANSWER_EVENT)
    .eq("key", LINE_TYPE_CLAIM_EVENT_KEY)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.value || !isLineType(data.value)) {
    return null;
  }

  return { lineType: data.value };
}

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
    source: USER_INPUT_SOURCE,
  };
}

/** Persists `line_type` attestation and advances resume step (§7.6.2). */
export async function persistQualifyScreen5Answers(
  supabase: SupabaseClient<Database>,
  params: { claimId: string; answers: QualifyScreen5Answers },
): Promise<void> {
  const { error } = await supabase.from("claim_events").insert(
    qualificationEventRow(
      params.claimId,
      LINE_TYPE_CLAIM_EVENT_KEY,
      params.answers.lineType,
    ),
  );

  if (error) {
    throw error;
  }

  await persistQualifyResumeStep(supabase, {
    claimId: params.claimId,
    step: 6,
  });
}

/** Validates POST body for Screen 5. */
export function parseQualifyScreen5Body(
  body: Record<string, unknown>,
): QualifyScreen5Answers | { error: string } {
  const lineType = parseQualifyLineType(body.line_type);
  if (typeof lineType === "object") {
    return lineType;
  }
  return { lineType };
}
