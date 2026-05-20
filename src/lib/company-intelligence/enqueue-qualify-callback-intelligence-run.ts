/**
 * CI-6.2 — Enqueue Lane B agent for a callback E.164 from qualify (voicemail / Screen 4).
 *
 * Mirrors CI-6.1 child runs: shares `claim_subject_id`, uses callback as
 * `phone_number_normalized`, skips CI-1.4 rate limits, does not reset
 * `company_intel_status` on the subject.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeUsPhoneToE164 } from "@/lib/check/us-phone";
import type { Database } from "@/types/database";

import {
  MAX_CALLBACK_RECURSIVE_LOOKUPS,
  pickCallbackNumbersForRecursiveLookup,
} from "./callback-recursive-policy";
import type { CompanyIntelligenceEnv } from "./company-intelligence-flags";
import { getCompanyIntelligenceFeatureFlags } from "./company-intelligence-flags";
import { triggerCompanyIntelligenceRunFetch } from "./trigger-company-intelligence-run";

export type QualifyCallbackIntelTrigger = "voicemail_upload" | "screen_4_save";

export type EnqueueQualifyCallbackIntelligenceRunParams = {
  admin: SupabaseClient<Database>;
  claimSubjectId: string;
  /** Screened caller E.164 from `claim_subjects.phone_number_normalized`. */
  subjectPhoneNormalized: string | null;
  callbackPhoneRaw: string;
  /** When true, skip enqueue if `claim_subjects.company_identified` (CI-6.2.2). */
  requireSubjectUnidentified?: boolean;
  trigger: QualifyCallbackIntelTrigger;
  env?: CompanyIntelligenceEnv;
};

export type EnqueueQualifyCallbackIntelligenceRunResult =
  | { enqueued: false; reason: string }
  | { enqueued: true; runId: string; callbackE164: string };

async function callbackRunExists(
  admin: SupabaseClient<Database>,
  claimSubjectId: string,
  phoneNumberNormalized: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("company_intelligence_runs")
    .select("id")
    .eq("claim_subject_id", claimSubjectId)
    .eq("phone_number_normalized", phoneNumberNormalized)
    .in("status", ["pending", "running", "completed"])
    .limit(1);

  if (error) {
    throw error;
  }
  return (data?.length ?? 0) > 0;
}

async function findLatestTopLevelParentRunId(
  admin: SupabaseClient<Database>,
  claimSubjectId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from("company_intelligence_runs")
    .select("id")
    .eq("claim_subject_id", claimSubjectId)
    .is("parent_run_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data?.id ?? null;
}

async function countCallbackChildrenForParent(
  admin: SupabaseClient<Database>,
  parentRunId: string,
): Promise<number> {
  const { count, error } = await admin
    .from("company_intelligence_runs")
    .select("id", { count: "exact", head: true })
    .eq("parent_run_id", parentRunId);

  if (error) {
    throw error;
  }
  return count ?? 0;
}

/**
 * Inserts a pending callback intelligence run when eligible.
 */
export async function enqueueQualifyCallbackIntelligenceRun(
  params: EnqueueQualifyCallbackIntelligenceRunParams,
): Promise<EnqueueQualifyCallbackIntelligenceRunResult> {
  const {
    admin,
    claimSubjectId,
    subjectPhoneNormalized,
    callbackPhoneRaw,
    requireSubjectUnidentified,
    trigger,
    env,
  } = params;

  const { agentEnabled } = getCompanyIntelligenceFeatureFlags(env);
  if (!agentEnabled) {
    return { enqueued: false, reason: "agent_disabled" };
  }

  if (requireSubjectUnidentified) {
    const { data: subject, error: subjectError } = await admin
      .from("claim_subjects")
      .select("company_identified, is_exempt")
      .eq("id", claimSubjectId)
      .maybeSingle();

    if (subjectError) {
      throw subjectError;
    }
    if (!subject) {
      return { enqueued: false, reason: "subject_missing" };
    }
    if (subject.is_exempt) {
      return { enqueued: false, reason: "subject_exempt" };
    }
    if (subject.company_identified) {
      return { enqueued: false, reason: "subject_identified" };
    }
  }

  const parentPhone = subjectPhoneNormalized ?? "";
  const callbacks = pickCallbackNumbersForRecursiveLookup({
    callbackNumbers: [callbackPhoneRaw],
    parentPhoneNormalized: parentPhone,
    maxCount: 1,
  });

  const callbackE164 = callbacks[0];
  if (!callbackE164) {
    return { enqueued: false, reason: "invalid_or_same_as_subject_phone" };
  }

  if (await callbackRunExists(admin, claimSubjectId, callbackE164)) {
    return { enqueued: false, reason: "existing_run" };
  }

  const parentRunId = await findLatestTopLevelParentRunId(admin, claimSubjectId);
  if (parentRunId) {
    const childCount = await countCallbackChildrenForParent(admin, parentRunId);
    if (childCount >= MAX_CALLBACK_RECURSIVE_LOOKUPS) {
      return { enqueued: false, reason: "callback_cap_reached" };
    }
  }

  const { data: child, error: insertError } = await admin
    .from("company_intelligence_runs")
    .insert({
      claim_subject_id: claimSubjectId,
      phone_number_normalized: callbackE164,
      status: "pending",
      parent_run_id: parentRunId,
      run_metadata: {
        qualify_callback_trigger: trigger,
      },
    })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  triggerCompanyIntelligenceRunFetch({ runId: child.id, env });

  return { enqueued: true, runId: child.id, callbackE164 };
}

/**
 * Fail-open wrapper for qualify API routes — logs and never throws.
 */
export async function maybeEnqueueQualifyCallbackIntelligenceRun(
  params: EnqueueQualifyCallbackIntelligenceRunParams,
): Promise<EnqueueQualifyCallbackIntelligenceRunResult> {
  try {
    return await enqueueQualifyCallbackIntelligenceRun(params);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "qualify_callback_intel_enqueue_failure",
        claim_subject_id: params.claimSubjectId,
        trigger: params.trigger,
        message: error instanceof Error ? error.message : "unknown",
      }),
    );
    return { enqueued: false, reason: "error" };
  }
}

/** Normalizes a raw callback string for logging (last4 only). */
export function redactCallbackPhoneForLog(raw: string): string {
  const e164 = normalizeUsPhoneToE164(raw);
  if (!e164) {
    return "invalid";
  }
  return `***${e164.slice(-4)}`;
}
