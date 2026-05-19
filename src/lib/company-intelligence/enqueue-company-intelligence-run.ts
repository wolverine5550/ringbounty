/**
 * CI-1.1 — Enqueue Lane B Company Intelligence run after Lane A spam persist.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  getCompanyIntelligenceFeatureFlags,
  type CompanyIntelligenceEnv,
} from "./company-intelligence-flags";
import { shouldEnqueueCompanyIntelligenceRun } from "./should-enqueue-company-intelligence-run";
import { triggerCompanyIntelligenceRunFetch } from "./trigger-company-intelligence-run";

export type EnqueueCompanyIntelligenceRunParams = {
  claimSubjectId: string;
  phoneNumberNormalized: string;
  companyIdentified: boolean;
  isExempt: boolean;
  env?: CompanyIntelligenceEnv;
};

export type EnqueueCompanyIntelligenceRunResult =
  | { enqueued: false }
  | { enqueued: true; runId: string };

/**
 * Inserts `company_intelligence_runs` (`status=pending`) and sets
 * `claim_subjects.company_intel_status=pending` when eligible.
 */
export async function enqueueCompanyIntelligenceRun(
  admin: SupabaseClient<Database>,
  params: EnqueueCompanyIntelligenceRunParams,
): Promise<EnqueueCompanyIntelligenceRunResult> {
  const { agentEnabled } = getCompanyIntelligenceFeatureFlags(params.env);
  if (
    !shouldEnqueueCompanyIntelligenceRun({
      agentEnabled,
      companyIdentified: params.companyIdentified,
      isExempt: params.isExempt,
    })
  ) {
    return { enqueued: false };
  }

  const { data: run, error: insertError } = await admin
    .from("company_intelligence_runs")
    .insert({
      claim_subject_id: params.claimSubjectId,
      phone_number_normalized: params.phoneNumberNormalized,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  const { error: updateError } = await admin
    .from("claim_subjects")
    .update({ company_intel_status: "pending" })
    .eq("id", params.claimSubjectId);

  if (updateError) {
    throw updateError;
  }

  return { enqueued: true, runId: run.id };
}

/**
 * Fail-open wrapper for `/check` — logs and never throws (Lane A must complete).
 */
export async function maybeEnqueueCompanyIntelligenceRun(
  admin: SupabaseClient<Database>,
  params: EnqueueCompanyIntelligenceRunParams,
): Promise<EnqueueCompanyIntelligenceRunResult> {
  try {
    const result = await enqueueCompanyIntelligenceRun(admin, params);
    if (result.enqueued) {
      triggerCompanyIntelligenceRunFetch({
        runId: result.runId,
        env: params.env,
      });
    }
    return result;
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "company_intel_enqueue_failure",
        claim_subject_id: params.claimSubjectId,
        phone_last4: params.phoneNumberNormalized.slice(-4),
        message: error instanceof Error ? error.message : "unknown",
      }),
    );
    return { enqueued: false };
  }
}
