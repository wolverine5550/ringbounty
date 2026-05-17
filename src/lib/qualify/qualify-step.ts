/**
 * Phase 7.1.3 — Parse `?step=`, resolve effective screen, build URLs, resume via `claim_events`.
 */

import type { ClaimEventType } from "@/lib/constants/claimEvent";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  QUALIFY_STEP_RESUME_EVENT_KEY,
  QUALIFY_WIZARD_STEP_MAX,
  QUALIFY_WIZARD_STEP_MIN,
  type QualifyWizardStep,
} from "./constants";

const QUALIFICATION_ANSWER_EVENT: ClaimEventType = "qualification_answer";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Returns false for malformed ids before hitting Postgres. */
export function isClaimSubjectIdUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/**
 * Parses `?step=` (1–5). Invalid or out-of-range values return `null`.
 */
export function parseQualifyStepFromQuery(
  raw: string | null | undefined,
): QualifyWizardStep | null {
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isInteger(n)) {
    return null;
  }
  if (n < QUALIFY_WIZARD_STEP_MIN || n > QUALIFY_WIZARD_STEP_MAX) {
    return null;
  }
  return n as QualifyWizardStep;
}

/** Parses persisted resume value from `claim_events.value`. */
export function parseQualifyStepFromEventValue(
  value: string | null | undefined,
): QualifyWizardStep | null {
  return parseQualifyStepFromQuery(value);
}

/**
 * URL step wins when present; otherwise last resume; otherwise screen 1.
 */
export function resolveQualifyWizardStep(params: {
  urlStep: QualifyWizardStep | null;
  resumeStep: QualifyWizardStep | null;
}): QualifyWizardStep {
  return params.urlStep ?? params.resumeStep ?? 1;
}

export function buildQualifyPageHref(params: {
  claimSubjectId: string;
  step?: QualifyWizardStep;
  claimId?: string;
}): string {
  const path = `/qualify/${params.claimSubjectId}`;
  const search = new URLSearchParams();
  if (params.step !== undefined) {
    search.set("step", String(params.step));
  }
  if (params.claimId) {
    search.set("claim", params.claimId);
  }
  const q = search.toString();
  return q ? `${path}?${q}` : path;
}

/** True once user has answered yes/no on the federal DNC gate (§6.2). */
export function isFederalDncAttestationComplete(
  federalDncRegistered: boolean | null | undefined,
): boolean {
  return federalDncRegistered !== null && federalDncRegistered !== undefined;
}

/** Latest `qualify_step_resume` event for the claim (§7.1.3). */
export async function loadQualifyResumeStep(
  supabase: SupabaseClient<Database>,
  claimId: string,
): Promise<QualifyWizardStep | null> {
  const { data, error } = await supabase
    .from("claim_events")
    .select("value")
    .eq("claim_id", claimId)
    .eq("event_type", QUALIFICATION_ANSWER_EVENT)
    .eq("key", QUALIFY_STEP_RESUME_EVENT_KEY)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return parseQualifyStepFromEventValue(data?.value);
}

/** Call when a wizard screen is completed (§7.2+). */
export async function persistQualifyResumeStep(
  supabase: SupabaseClient<Database>,
  params: { claimId: string; step: QualifyWizardStep },
): Promise<void> {
  const { error } = await supabase.from("claim_events").insert({
    claim_id: params.claimId,
    event_type: QUALIFICATION_ANSWER_EVENT,
    key: QUALIFY_STEP_RESUME_EVENT_KEY,
    value: String(params.step),
    source: "user_input",
  });

  if (error) {
    throw error;
  }
}
