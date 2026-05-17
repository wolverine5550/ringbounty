/**
 * Phase 7.3 — Screen 2 stop request / willful: load and persist answers.
 *
 * Writes `qualification_answer` claim_events (prd.md §5) and `internal_dnc_*` on
 * `dnc_check_results` (prd.md `dnc_check_results` schema).
 */

import type { StopRequestMethod } from "@/lib/constants/qualify-screen-2";
import { isStopRequestMethod } from "@/lib/constants/qualify-screen-2";
import type { ClaimEventType } from "@/lib/constants/claimEvent";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import { parseQualificationBooleanValue } from "./screen-1-consent";
import { persistQualifyResumeStep } from "./qualify-step";

const QUALIFICATION_ANSWER_EVENT: ClaimEventType = "qualification_answer";
const USER_INPUT_SOURCE = "user_input" as const;

/** `claim_events.key` values for Screen 2 (prd.md §5 example rows). */
export const QUALIFY_SCREEN_2_KEYS = {
  stopRequestMade: "stop_request_made",
  stopRequestMethod: "stop_request_method",
  stopRequestDate: "stop_request_date",
  callsAfterStopRequest: "calls_after_stop_request",
} as const;

const SCREEN_2_KEYS = Object.values(QUALIFY_SCREEN_2_KEYS);

export type QualifyScreen2Answers = {
  stopRequestMade: boolean;
  stopRequestMethod: StopRequestMethod | null;
  stopRequestDate: string | null;
  callsAfterStopRequest: boolean | null;
};

/**
 * Maps UI answers to `dnc_check_results.internal_dnc_*` (prd.md §5).
 * When no stop request: violated = false; method/date null.
 * When stop request + post-stop calls: violated = true (willful path).
 */
export function resolveInternalDncFieldsFromScreen2(
  answers: QualifyScreen2Answers,
): Pick<
  Database["public"]["Tables"]["dnc_check_results"]["Update"],
  | "internal_dnc_violated"
  | "internal_dnc_stop_request_method"
  | "internal_dnc_stop_request_date"
> {
  if (!answers.stopRequestMade) {
    return {
      internal_dnc_violated: false,
      internal_dnc_stop_request_method: null,
      internal_dnc_stop_request_date: null,
    };
  }

  return {
    internal_dnc_violated: answers.callsAfterStopRequest === true,
    internal_dnc_stop_request_method: answers.stopRequestMethod,
    internal_dnc_stop_request_date: answers.stopRequestDate,
  };
}

/** Validates YYYY-MM-DD and rejects future dates (§7.3.3). */
export function parseStopRequestDate(
  value: unknown,
): string | { error: string } {
  if (typeof value !== "string") {
    return { error: "stop_request_date must be YYYY-MM-DD" };
  }

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { error: "stop_request_date must be YYYY-MM-DD" };
  }

  const parsed = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { error: "stop_request_date is not a valid date" };
  }

  const today = new Date();
  const todayEnd = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999,
  );
  if (parsed > todayEnd) {
    return { error: "stop_request_date cannot be in the future" };
  }

  return trimmed;
}

/**
 * Latest Screen 2 answers for a claim (one row per key, most recent wins).
 */
export async function loadQualifyScreen2Answers(
  supabase: SupabaseClient<Database>,
  claimId: string,
): Promise<QualifyScreen2Answers | null> {
  const { data, error } = await supabase
    .from("claim_events")
    .select("key, value, created_at")
    .eq("claim_id", claimId)
    .eq("event_type", QUALIFICATION_ANSWER_EVENT)
    .in("key", SCREEN_2_KEYS)
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

  const stopRequestMade = parseQualificationBooleanValue(
    latest.get(QUALIFY_SCREEN_2_KEYS.stopRequestMade),
  );
  if (stopRequestMade === null) {
    return null;
  }

  if (!stopRequestMade) {
    return {
      stopRequestMade: false,
      stopRequestMethod: null,
      stopRequestDate: null,
      callsAfterStopRequest: null,
    };
  }

  const methodRaw = latest.get(QUALIFY_SCREEN_2_KEYS.stopRequestMethod);
  const stopRequestMethod =
    methodRaw && isStopRequestMethod(methodRaw) ? methodRaw : null;
  const stopRequestDate = latest.get(QUALIFY_SCREEN_2_KEYS.stopRequestDate) ?? null;
  const callsAfterStopRequest = parseQualificationBooleanValue(
    latest.get(QUALIFY_SCREEN_2_KEYS.callsAfterStopRequest),
  );

  if (
    !stopRequestMethod ||
    !stopRequestDate ||
    callsAfterStopRequest === null
  ) {
    return null;
  }

  return {
    stopRequestMade: true,
    stopRequestMethod,
    stopRequestDate,
    callsAfterStopRequest,
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

/**
 * Persists Q4–Q7 to `claim_events`, updates `dnc_check_results.internal_dnc_*`,
 * and sets resume step 2.
 */
export async function persistQualifyScreen2Answers(
  supabase: SupabaseClient<Database>,
  params: {
    claimId: string;
    claimSubjectId: string;
    phoneNumberNormalized: string;
    answers: QualifyScreen2Answers;
  },
): Promise<void> {
  const { claimId, claimSubjectId, phoneNumberNormalized, answers } = params;

  const rows: Database["public"]["Tables"]["claim_events"]["Insert"][] = [
    qualificationEventRow(
      claimId,
      QUALIFY_SCREEN_2_KEYS.stopRequestMade,
      String(answers.stopRequestMade),
    ),
  ];

  if (answers.stopRequestMade) {
    if (
      !answers.stopRequestMethod ||
      !answers.stopRequestDate ||
      answers.callsAfterStopRequest === null
    ) {
      throw new Error("Screen 2 stop-request branch requires method, date, and Q7");
    }

    rows.push(
      qualificationEventRow(
        claimId,
        QUALIFY_SCREEN_2_KEYS.stopRequestMethod,
        answers.stopRequestMethod,
      ),
      qualificationEventRow(
        claimId,
        QUALIFY_SCREEN_2_KEYS.stopRequestDate,
        answers.stopRequestDate,
      ),
      qualificationEventRow(
        claimId,
        QUALIFY_SCREEN_2_KEYS.callsAfterStopRequest,
        String(answers.callsAfterStopRequest),
      ),
    );
  }

  const { error: insertError } = await supabase.from("claim_events").insert(rows);
  if (insertError) {
    throw insertError;
  }

  const internalDnc = resolveInternalDncFieldsFromScreen2(answers);

  const { data: existing, error: loadError } = await supabase
    .from("dnc_check_results")
    .select("id")
    .eq("claim_subject_id", claimSubjectId)
    .maybeSingle();

  if (loadError) {
    throw loadError;
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("dnc_check_results")
      .update(internalDnc)
      .eq("id", existing.id);

    if (updateError) {
      throw updateError;
    }
  } else {
    const { error: insertDncError } = await supabase.from("dnc_check_results").insert({
      claim_id: claimId,
      claim_subject_id: claimSubjectId,
      phone_number_normalized: phoneNumberNormalized,
      ...internalDnc,
    });

    if (insertDncError) {
      throw insertDncError;
    }
  }

  await persistQualifyResumeStep(supabase, { claimId, step: 2 });
}

/** Validates API body for Screen 2 (§7.3.1–7.3.4). */
export function parseQualifyScreen2Body(
  body: Record<string, unknown>,
): QualifyScreen2Answers | { error: string } {
  const stopRequestMade = body.stop_request_made;
  if (stopRequestMade !== true && stopRequestMade !== false) {
    return { error: "stop_request_made must be true or false" };
  }

  if (!stopRequestMade) {
    return {
      stopRequestMade: false,
      stopRequestMethod: null,
      stopRequestDate: null,
      callsAfterStopRequest: null,
    };
  }

  const methodRaw = body.stop_request_method;
  if (typeof methodRaw !== "string" || !isStopRequestMethod(methodRaw)) {
    return {
      error:
        "stop_request_method must be one of: text_stop, text_stop_reply, verbal, email, written",
    };
  }

  const parsedDate = parseStopRequestDate(body.stop_request_date);
  if (typeof parsedDate === "object") {
    return parsedDate;
  }

  const callsAfterStopRequest = body.calls_after_stop_request;
  if (callsAfterStopRequest !== true && callsAfterStopRequest !== false) {
    return { error: "calls_after_stop_request must be true or false" };
  }

  return {
    stopRequestMade: true,
    stopRequestMethod: methodRaw,
    stopRequestDate: parsedDate,
    callsAfterStopRequest,
  };
}
