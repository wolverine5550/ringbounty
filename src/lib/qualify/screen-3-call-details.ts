/**
 * Phase 7.4 — Screen 3 call details: load and persist answers.
 *
 * Writes `qualification_answer` claim_events (prd.md §5) and recomputes federal DNC
 * eligibility when Q10 `most_recent_call_date` is saved (§6.2.2).
 */

import type { CallCountTotalBucket } from "@/lib/constants/qualify-screen-3";
import { isCallCountTotalBucket } from "@/lib/constants/qualify-screen-3";
import type { ClaimEventType } from "@/lib/constants/claimEvent";
import { recomputeFederalDncEligibility } from "@/lib/dnc/recompute-federal-dnc-eligibility";
import type { FederalDncAttestationInput } from "@/lib/dnc/federal-dnc-attestation-gate";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import { parseQualificationBooleanValue } from "./screen-1-consent";
import { persistQualifyResumeStep } from "./qualify-step";
import {
  loadQualifyScreen2Answers,
  parseStopRequestDate,
} from "./screen-2-stop-request";

const QUALIFICATION_ANSWER_EVENT: ClaimEventType = "qualification_answer";
const USER_INPUT_SOURCE = "user_input" as const;

/** `claim_events.key` values for Screen 3 (prd.md §5 example rows). */
export const QUALIFY_SCREEN_3_KEYS = {
  callCountTotal: "call_count_total",
  callCountAfterStop: "call_count_after_stop",
  mostRecentCallDate: "most_recent_call_date",
  callsBefore8am: "calls_before_8am",
  callsAfter9pm: "calls_after_9pm",
  callsAfter9pmCount: "calls_after_9pm_count",
} as const;

const SCREEN_3_KEYS = Object.values(QUALIFY_SCREEN_3_KEYS);

export type QualifyScreen3Answers = {
  callCountTotal: CallCountTotalBucket;
  callCountAfterStop: number | null;
  mostRecentCallDate: string;
  callsBefore8am: boolean;
  callsAfter9pm: boolean;
  callsAfter9pmCount: number | null;
};

/** Validates a positive integer call count (1–9999). */
export function parsePositiveCallCount(
  value: unknown,
  fieldName: string,
): number | { error: string } {
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    if (parsed >= 1 && parsed <= 9999) {
      return parsed;
    }
  }
  if (typeof value === "number" && Number.isInteger(value)) {
    if (value >= 1 && value <= 9999) {
      return value;
    }
  }
  return { error: `${fieldName} must be an integer from 1 to 9999` };
}

/**
 * Latest Screen 3 answers for a claim (one row per key, most recent wins).
 */
export async function loadQualifyScreen3Answers(
  supabase: SupabaseClient<Database>,
  claimId: string,
): Promise<QualifyScreen3Answers | null> {
  const { data, error } = await supabase
    .from("claim_events")
    .select("key, value, created_at")
    .eq("claim_id", claimId)
    .eq("event_type", QUALIFICATION_ANSWER_EVENT)
    .in("key", SCREEN_3_KEYS)
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

  const totalRaw = latest.get(QUALIFY_SCREEN_3_KEYS.callCountTotal);
  const totalParsed = totalRaw ? Number(totalRaw) : NaN;
  if (!isCallCountTotalBucket(totalParsed)) {
    return null;
  }

  const mostRecentRaw = latest.get(QUALIFY_SCREEN_3_KEYS.mostRecentCallDate);
  if (!mostRecentRaw) {
    return null;
  }

  const callsBefore8am = parseQualificationBooleanValue(
    latest.get(QUALIFY_SCREEN_3_KEYS.callsBefore8am),
  );
  const callsAfter9pm = parseQualificationBooleanValue(
    latest.get(QUALIFY_SCREEN_3_KEYS.callsAfter9pm),
  );

  if (callsBefore8am === null || callsAfter9pm === null) {
    return null;
  }

  let callsAfter9pmCount: number | null = null;
  if (callsAfter9pm) {
    const countRaw = latest.get(QUALIFY_SCREEN_3_KEYS.callsAfter9pmCount);
    const countParsed = countRaw ? Number(countRaw) : NaN;
    if (!Number.isInteger(countParsed) || countParsed < 1) {
      return null;
    }
    callsAfter9pmCount = countParsed;
  }

  let callCountAfterStop: number | null = null;
  const afterStopRaw = latest.get(QUALIFY_SCREEN_3_KEYS.callCountAfterStop);
  if (afterStopRaw !== undefined && afterStopRaw !== null) {
    const afterStopParsed = Number(afterStopRaw);
    if (!Number.isInteger(afterStopParsed) || afterStopParsed < 1) {
      return null;
    }
    callCountAfterStop = afterStopParsed;
  }

  return {
    callCountTotal: totalParsed,
    callCountAfterStop,
    mostRecentCallDate: mostRecentRaw,
    callsBefore8am,
    callsAfter9pm,
    callsAfter9pmCount,
  };
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

function attestationFromDncRow(
  row: Pick<
    Database["public"]["Tables"]["dnc_check_results"]["Row"],
    "federal_dnc_registered" | "federal_dnc_registration_date"
  > | null,
): FederalDncAttestationInput | null {
  if (row?.federal_dnc_registered === null || row?.federal_dnc_registered === undefined) {
    return null;
  }

  return {
    federalDncRegistered: row.federal_dnc_registered,
    federalDncRegistrationDate: row.federal_dnc_registration_date,
  };
}

/**
 * Persists Q8–Q12 to `claim_events`, resume step 3, and recomputes federal DNC when possible.
 */
export async function persistQualifyScreen3Answers(
  supabase: SupabaseClient<Database>,
  params: {
    claimId: string;
    claimSubjectId: string;
    answers: QualifyScreen3Answers;
  },
): Promise<{ federalDncEligible: boolean | null }> {
  const { claimId, claimSubjectId, answers } = params;

  const screen2 = await loadQualifyScreen2Answers(supabase, claimId);
  if (screen2?.stopRequestMade && answers.callCountAfterStop === null) {
    throw new Error("Screen 3 requires call_count_after_stop when stop request was made");
  }

  const rows: Database["public"]["Tables"]["claim_events"]["Insert"][] = [
    qualificationEventRow(
      claimId,
      QUALIFY_SCREEN_3_KEYS.callCountTotal,
      String(answers.callCountTotal),
    ),
    qualificationEventRow(
      claimId,
      QUALIFY_SCREEN_3_KEYS.mostRecentCallDate,
      answers.mostRecentCallDate,
    ),
    qualificationEventRow(
      claimId,
      QUALIFY_SCREEN_3_KEYS.callsBefore8am,
      String(answers.callsBefore8am),
    ),
    qualificationEventRow(
      claimId,
      QUALIFY_SCREEN_3_KEYS.callsAfter9pm,
      String(answers.callsAfter9pm),
    ),
  ];

  if (answers.callCountAfterStop !== null) {
    rows.push(
      qualificationEventRow(
        claimId,
        QUALIFY_SCREEN_3_KEYS.callCountAfterStop,
        String(answers.callCountAfterStop),
      ),
    );
  }

  if (answers.callsAfter9pm && answers.callsAfter9pmCount !== null) {
    rows.push(
      qualificationEventRow(
        claimId,
        QUALIFY_SCREEN_3_KEYS.callsAfter9pmCount,
        String(answers.callsAfter9pmCount),
      ),
    );
  }

  const { error: insertError } = await supabase.from("claim_events").insert(rows);
  if (insertError) {
    throw insertError;
  }

  await persistQualifyResumeStep(supabase, { claimId, step: 3 });

  const { data: dncRow, error: dncError } = await supabase
    .from("dnc_check_results")
    .select("federal_dnc_registered, federal_dnc_registration_date")
    .eq("claim_subject_id", claimSubjectId)
    .maybeSingle();

  if (dncError) {
    throw dncError;
  }

  const attestation = attestationFromDncRow(dncRow);
  if (!attestation) {
    return { federalDncEligible: null };
  }

  const { federalDncEligible } = await recomputeFederalDncEligibility(supabase, {
    claimId,
    claimSubjectId,
    attestation,
    earliestCallDate: answers.mostRecentCallDate,
  });

  return { federalDncEligible };
}

/** Validates API body for Screen 3 (§7.4.1–7.4.4). */
export async function parseQualifyScreen3Body(
  supabase: SupabaseClient<Database>,
  claimId: string,
  body: Record<string, unknown>,
): Promise<QualifyScreen3Answers | { error: string }> {
  const totalRaw = body.call_count_total;
  const totalParsed =
    typeof totalRaw === "number"
      ? totalRaw
      : typeof totalRaw === "string"
        ? Number(totalRaw)
        : NaN;

  if (!isCallCountTotalBucket(totalParsed)) {
    return {
      error:
        "call_count_total must be one of: 1, 2, 5, 10, 20 (call count buckets)",
    };
  }

  const mostRecentCallDate = parseStopRequestDate(body.most_recent_call_date);
  if (typeof mostRecentCallDate === "object") {
    return mostRecentCallDate;
  }

  const callsBefore8am = body.calls_before_8am;
  if (callsBefore8am !== true && callsBefore8am !== false) {
    return { error: "calls_before_8am must be true or false" };
  }

  const callsAfter9pm = body.calls_after_9pm;
  if (callsAfter9pm !== true && callsAfter9pm !== false) {
    return { error: "calls_after_9pm must be true or false" };
  }

  let callsAfter9pmCount: number | null = null;
  if (callsAfter9pm) {
    const countParsed = parsePositiveCallCount(
      body.calls_after_9pm_count,
      "calls_after_9pm_count",
    );
    if (typeof countParsed === "object") {
      return countParsed;
    }
    callsAfter9pmCount = countParsed;
  }

  const screen2 = await loadQualifyScreen2Answers(supabase, claimId);
  let callCountAfterStop: number | null = null;

  if (screen2?.stopRequestMade) {
    const afterStopParsed = parsePositiveCallCount(
      body.call_count_after_stop,
      "call_count_after_stop",
    );
    if (typeof afterStopParsed === "object") {
      return afterStopParsed;
    }
    if (afterStopParsed > totalParsed) {
      return {
        error: "call_count_after_stop cannot exceed call_count_total",
      };
    }
    callCountAfterStop = afterStopParsed;
  }

  return {
    callCountTotal: totalParsed,
    callCountAfterStop,
    mostRecentCallDate,
    callsBefore8am,
    callsAfter9pm,
    callsAfter9pmCount,
  };
}
