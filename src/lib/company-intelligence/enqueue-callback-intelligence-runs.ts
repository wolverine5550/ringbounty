/**
 * CI-6.1.1 / CI-6.1.4 — Enqueue child `company_intelligence_runs` for synthesis callbacks.
 *
 * Child runs share the parent `claim_subject_id` but use the callback E.164 as
 * `phone_number_normalized`. Does not consume CI-1.4 enqueue rate limits or reset
 * `company_intel_status` on the subject (parent Screen 4 UX stays `completed`).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  pickCallbackNumbersForRecursiveLookup,
} from "./callback-recursive-policy";
import type { CompanyIntelligenceEnv } from "./company-intelligence-flags";
import { getCompanyIntelligenceFeatureFlags } from "./company-intelligence-flags";
import type { RunCompanyIntelligenceAgentResult } from "./run-company-intelligence-agent";
import { triggerCompanyIntelligenceRunFetch } from "./trigger-company-intelligence-run";

type IntelligenceRunRow =
  Database["public"]["Tables"]["company_intelligence_runs"]["Row"];

export type EnqueueCallbackIntelligenceRunsParams = {
  admin: SupabaseClient<Database>;
  parentRun: IntelligenceRunRow;
  agentResult: RunCompanyIntelligenceAgentResult;
  env?: CompanyIntelligenceEnv;
};

export type EnqueueCallbackIntelligenceRunsResult = {
  enqueued: string[];
  skipped: { phone: string; reason: string }[];
};

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

/**
 * After a top-level parent run completes, enqueue up to two callback child runs.
 */
export async function enqueueCallbackIntelligenceRuns(
  params: EnqueueCallbackIntelligenceRunsParams,
): Promise<EnqueueCallbackIntelligenceRunsResult> {
  const { admin, parentRun, agentResult, env } = params;
  const result: EnqueueCallbackIntelligenceRunsResult = {
    enqueued: [],
    skipped: [],
  };

  const { agentEnabled } = getCompanyIntelligenceFeatureFlags(env);
  if (!agentEnabled) {
    return result;
  }

  // CI-6.1 — only one recursion level (parent → callback children).
  if (parentRun.parent_run_id) {
    return result;
  }

  const synthesis = agentResult.synthesis;
  if (!synthesis?.callbackNumbers?.length) {
    return result;
  }

  const callbacks = pickCallbackNumbersForRecursiveLookup({
    callbackNumbers: synthesis.callbackNumbers,
    parentPhoneNormalized: parentRun.phone_number_normalized,
  });

  if (callbacks.length === 0) {
    return result;
  }

  const parentMeta =
    parentRun.run_metadata &&
    typeof parentRun.run_metadata === "object" &&
    !Array.isArray(parentRun.run_metadata)
      ? (parentRun.run_metadata as Record<string, unknown>)
      : {};

  const enqueuedPhones: string[] = [];

  for (const phone of callbacks) {
    if (await callbackRunExists(admin, parentRun.claim_subject_id, phone)) {
      result.skipped.push({ phone, reason: "existing_run" });
      continue;
    }

    const { data: child, error: insertError } = await admin
      .from("company_intelligence_runs")
      .insert({
        claim_subject_id: parentRun.claim_subject_id,
        phone_number_normalized: phone,
        status: "pending",
        parent_run_id: parentRun.id,
      })
      .select("id")
      .single();

    if (insertError) {
      result.skipped.push({ phone, reason: "insert_failed" });
      continue;
    }

    result.enqueued.push(phone);
    enqueuedPhones.push(phone);
    triggerCompanyIntelligenceRunFetch({ runId: child.id, env });
  }

  if (enqueuedPhones.length > 0) {
    const { error: metaError } = await admin
      .from("company_intelligence_runs")
      .update({
        run_metadata: {
          ...parentMeta,
          callback_children_enqueued: enqueuedPhones,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", parentRun.id);

    if (metaError) {
      throw metaError;
    }
  }

  return result;
}
