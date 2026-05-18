/**
 * Phase 7.2 — Screen 1 consent / EBR: load and persist `claim_events` answers.
 *
 * Keys align with prd.md `claim_events` examples (`gave_direct_consent`, etc.).
 */

import type { ClaimEventType } from "@/lib/constants/claimEvent";
import {
  QUALIFY_EBR_STRENGTH_ADJUSTMENT_NOTE,
} from "@/lib/constants/qualify-screen-1";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import { persistQualifyResumeStep } from "./qualify-step";

const QUALIFICATION_ANSWER_EVENT: ClaimEventType = "qualification_answer";
const USER_INPUT_SOURCE = "user_input" as const;

/** `claim_events.key` values for Screen 1 (prd.md §5 example rows). */
export const QUALIFY_SCREEN_1_KEYS = {
  gaveDirectConsent: "gave_direct_consent",
  thirdPartyConsentPossible: "third_party_consent_possible",
  hasExistingRelationship: "has_existing_relationship",
} as const;

export const EBR_STRENGTH_ADJUSTMENT_APPLIED_KEY =
  "ebr_strength_adjustment_applied" as const;

export const EBR_STRENGTH_ADJUSTMENT_NOTE_KEY =
  "ebr_strength_adjustment_note" as const;

export type QualifyScreen1Answers = {
  gaveDirectConsent: boolean;
  thirdPartyConsentPossible: boolean;
  hasExistingRelationship: boolean;
};

const SCREEN_1_KEYS = Object.values(QUALIFY_SCREEN_1_KEYS);

/** Parses persisted `claim_events.value` as boolean. */
export function parseQualificationBooleanValue(
  value: string | null | undefined,
): boolean | null {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return null;
}

/** True when PRD EBR explainer should run (Q1 or Q3 yes). */
export function shouldShowEbrExplainer(
  answers: Pick<
    QualifyScreen1Answers,
    "gaveDirectConsent" | "hasExistingRelationship"
  >,
): boolean {
  return answers.gaveDirectConsent || answers.hasExistingRelationship;
}

/**
 * Latest Screen 1 answers for a claim (one row per key, most recent wins).
 */
export async function loadQualifyScreen1Answers(
  supabase: SupabaseClient<Database>,
  claimId: string,
): Promise<QualifyScreen1Answers | null> {
  const { data, error } = await supabase
    .from("claim_events")
    .select("key, value, created_at")
    .eq("claim_id", claimId)
    .eq("event_type", QUALIFICATION_ANSWER_EVENT)
    .in("key", SCREEN_1_KEYS)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const latest = new Map<string, string | null>();
  for (const row of data ?? []) {
    if (row.key && !latest.has(row.key)) {
      latest.set(row.key, row.value);
    }
  }

  const gaveDirectConsent = parseQualificationBooleanValue(
    latest.get(QUALIFY_SCREEN_1_KEYS.gaveDirectConsent),
  );
  const thirdPartyConsentPossible = parseQualificationBooleanValue(
    latest.get(QUALIFY_SCREEN_1_KEYS.thirdPartyConsentPossible),
  );
  const hasExistingRelationship = parseQualificationBooleanValue(
    latest.get(QUALIFY_SCREEN_1_KEYS.hasExistingRelationship),
  );

  if (gaveDirectConsent === null || hasExistingRelationship === null) {
    return null;
  }

  return {
    gaveDirectConsent,
    thirdPartyConsentPossible: thirdPartyConsentPossible ?? false,
    hasExistingRelationship,
  };
}

function booleanEventRow(
  claimId: string,
  key: string,
  value: boolean,
): Database["public"]["Tables"]["claim_events"]["Insert"] {
  return {
    claim_id: claimId,
    event_type: QUALIFICATION_ANSWER_EVENT,
    key,
    value: String(value),
    source: USER_INPUT_SOURCE,
  };
}

/**
 * Persists Q1–Q3, optional EBR scoring note (§7.2.4), and resume step 1.
 */
export async function persistQualifyScreen1Answers(
  supabase: SupabaseClient<Database>,
  params: { claimId: string; answers: QualifyScreen1Answers },
): Promise<{ showEbrExplainer: boolean }> {
  const { claimId, answers } = params;
  const showEbrExplainer = shouldShowEbrExplainer(answers);

  const rows: Database["public"]["Tables"]["claim_events"]["Insert"][] = [
    booleanEventRow(
      claimId,
      QUALIFY_SCREEN_1_KEYS.gaveDirectConsent,
      answers.gaveDirectConsent,
    ),
    booleanEventRow(
      claimId,
      QUALIFY_SCREEN_1_KEYS.thirdPartyConsentPossible,
      answers.thirdPartyConsentPossible,
    ),
    booleanEventRow(
      claimId,
      QUALIFY_SCREEN_1_KEYS.hasExistingRelationship,
      answers.hasExistingRelationship,
    ),
  ];

  if (showEbrExplainer) {
    rows.push(
      {
        claim_id: claimId,
        event_type: QUALIFICATION_ANSWER_EVENT,
        key: EBR_STRENGTH_ADJUSTMENT_APPLIED_KEY,
        value: "true",
        source: USER_INPUT_SOURCE,
      },
      {
        claim_id: claimId,
        event_type: QUALIFICATION_ANSWER_EVENT,
        key: EBR_STRENGTH_ADJUSTMENT_NOTE_KEY,
        value: QUALIFY_EBR_STRENGTH_ADJUSTMENT_NOTE,
        source: USER_INPUT_SOURCE,
      },
    );
  }

  const { error: insertError } = await supabase.from("claim_events").insert(rows);
  if (insertError) {
    throw insertError;
  }

  await persistQualifyResumeStep(supabase, { claimId, step: 5 });

  return { showEbrExplainer };
}

/** Validates API body — all three answers must be explicit booleans. */
export function parseQualifyScreen1Body(
  body: Record<string, unknown>,
): QualifyScreen1Answers | { error: string } {
  const gaveDirectConsent = body.gave_direct_consent;
  const thirdPartyConsentPossible = body.third_party_consent_possible;
  const hasExistingRelationship = body.has_existing_relationship;

  if (gaveDirectConsent !== true && gaveDirectConsent !== false) {
    return { error: "gave_direct_consent must be true or false" };
  }
  if (
    hasExistingRelationship !== true &&
    hasExistingRelationship !== false
  ) {
    return { error: "has_existing_relationship must be true or false" };
  }

  const thirdPartyResolved =
    thirdPartyConsentPossible === true || thirdPartyConsentPossible === false
      ? thirdPartyConsentPossible
      : false;

  return {
    gaveDirectConsent,
    thirdPartyConsentPossible: thirdPartyResolved,
    hasExistingRelationship,
  };
}
