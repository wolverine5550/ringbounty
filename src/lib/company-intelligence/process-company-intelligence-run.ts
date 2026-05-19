/**
 * CI-1.2 — Process one or more `company_intelligence_runs` rows (claimed or by id).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  getCompanyIntelligenceFeatureFlags,
  type CompanyIntelligenceEnv,
} from "./company-intelligence-flags";
import { runCompanyIntelligenceAgent } from "./run-company-intelligence-agent";
import {
  clampCronBatchSize,
  COMPANY_INTEL_CRON_BATCH_SIZE_DEFAULT,
  computeRetryDelaySeconds,
  shouldPermanentlyFail,
} from "./worker-policy";

type IntelligenceRunRow =
  Database["public"]["Tables"]["company_intelligence_runs"]["Row"];

export type ProcessCompanyIntelligenceRunsParams = {
  /** Process a single run (optional submit-time fetch). */
  runId?: string;
  /** Batch claim size when `runId` omitted (RPC default 5). */
  batchSize?: number;
  env?: CompanyIntelligenceEnv;
};

export type ProcessCompanyIntelligenceRunOutcome =
  | { runId: string; status: "completed" }
  | { runId: string; status: "failed" }
  | { runId: string; status: "retry_pending"; attemptCount: number }
  | { runId: string; status: "skipped"; reason: string };

export type ProcessCompanyIntelligenceRunsResult = {
  agentDisabled: boolean;
  outcomes: ProcessCompanyIntelligenceRunOutcome[];
};

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }
  return "processing_error";
}

async function claimRunById(
  admin: SupabaseClient<Database>,
  runId: string,
): Promise<IntelligenceRunRow | null> {
  const now = new Date().toISOString();
  const { data: claimed, error: claimError } = await admin
    .from("company_intelligence_runs")
    .update({
      status: "running",
      started_at: now,
      updated_at: now,
    })
    .eq("id", runId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (claimError) {
    throw claimError;
  }
  if (claimed) {
    return claimed;
  }

  const { data: existing, error: loadError } = await admin
    .from("company_intelligence_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();

  if (loadError) {
    throw loadError;
  }
  if (existing?.status === "running") {
    return existing;
  }
  return null;
}

async function claimPendingBatch(
  admin: SupabaseClient<Database>,
  batchSize: number,
): Promise<IntelligenceRunRow[]> {
  const { data, error } = await admin.rpc("claim_company_intelligence_runs", {
    p_batch_size: clampCronBatchSize(batchSize),
  });
  if (error) {
    throw error;
  }
  return data ?? [];
}

async function markRunCompleted(
  admin: SupabaseClient<Database>,
  run: IntelligenceRunRow,
  agentResult: Awaited<ReturnType<typeof runCompanyIntelligenceAgent>>,
): Promise<void> {
  const now = new Date().toISOString();
  const durationMs = agentResult.durationMs;
  const synthesis = agentResult.synthesis;

  const runPatch: Database["public"]["Tables"]["company_intelligence_runs"]["Update"] =
    {
      status: "completed",
      duration_ms: durationMs,
      updated_at: now,
      last_error: null,
      sources_queried: agentResult.roundAudits as Database["public"]["Tables"]["company_intelligence_runs"]["Update"]["sources_queried"],
      raw_results: agentResult.rawResults as Database["public"]["Tables"]["company_intelligence_runs"]["Update"]["raw_results"],
    };

  const subjectPatch: Database["public"]["Tables"]["claim_subjects"]["Update"] =
    {
      company_intel_status: "completed",
    };

  if (synthesis) {
    runPatch.synthesized_company_name = synthesis.companyName;
    runPatch.synthesized_confidence = synthesis.confidence;
    runPatch.synthesized_reasoning = synthesis.reasoning;
    runPatch.callback_numbers = synthesis.callbackNumbers;
    runPatch.is_spoofed_pool = synthesis.isSpoofedPool;
    subjectPatch.company_name_suggested = synthesis.companyName;
    subjectPatch.company_intel_confidence = synthesis.confidence;
    subjectPatch.company_intel_reasoning = synthesis.reasoning;
  }

  const { error: runError } = await admin
    .from("company_intelligence_runs")
    .update(runPatch)
    .eq("id", run.id);
  if (runError) {
    throw runError;
  }

  const { error: subjectError } = await admin
    .from("claim_subjects")
    .update(subjectPatch)
    .eq("id", run.claim_subject_id);
  if (subjectError) {
    throw subjectError;
  }
}

async function markRunFailed(
  admin: SupabaseClient<Database>,
  run: IntelligenceRunRow,
  message: string,
): Promise<ProcessCompanyIntelligenceRunOutcome> {
  const nextAttemptCount = run.attempt_count + 1;
  const now = new Date().toISOString();

  if (shouldPermanentlyFail(nextAttemptCount)) {
    const { error: runError } = await admin
      .from("company_intelligence_runs")
      .update({
        status: "failed",
        attempt_count: nextAttemptCount,
        last_error: message,
        updated_at: now,
      })
      .eq("id", run.id);
    if (runError) {
      throw runError;
    }

    const { error: subjectError } = await admin
      .from("claim_subjects")
      .update({ company_intel_status: "failed" })
      .eq("id", run.claim_subject_id);
    if (subjectError) {
      throw subjectError;
    }

    console.error(
      JSON.stringify({
        event: "company_intel_run_failed",
        run_id: run.id,
        claim_subject_id: run.claim_subject_id,
        attempt_count: nextAttemptCount,
        last_error: message,
      }),
    );

    return { runId: run.id, status: "failed" };
  }

  const delaySeconds = computeRetryDelaySeconds(nextAttemptCount);
  const nextAttemptAt = new Date(Date.now() + delaySeconds * 1000).toISOString();

  const { error: runError } = await admin
    .from("company_intelligence_runs")
    .update({
      status: "pending",
      attempt_count: nextAttemptCount,
      next_attempt_at: nextAttemptAt,
      last_error: message,
      updated_at: now,
    })
    .eq("id", run.id);
  if (runError) {
    throw runError;
  }

  const { error: subjectError } = await admin
    .from("claim_subjects")
    .update({ company_intel_status: "pending" })
    .eq("id", run.claim_subject_id);
  if (subjectError) {
    throw subjectError;
  }

  console.error(
    JSON.stringify({
      event: "company_intel_run_retry",
      run_id: run.id,
      claim_subject_id: run.claim_subject_id,
      attempt_count: nextAttemptCount,
      next_attempt_at: nextAttemptAt,
      last_error: message,
    }),
  );

  return {
    runId: run.id,
    status: "retry_pending",
    attemptCount: nextAttemptCount,
  };
}

/**
 * Runs the agent for one row (must be `running` or claimed to `running`).
 */
export async function processCompanyIntelligenceRun(
  admin: SupabaseClient<Database>,
  run: IntelligenceRunRow,
  env?: CompanyIntelligenceEnv,
): Promise<ProcessCompanyIntelligenceRunOutcome> {
  const started = Date.now();
  try {
    const agentResult = await runCompanyIntelligenceAgent({
      admin,
      phoneNumberNormalized: run.phone_number_normalized,
      claimSubjectId: run.claim_subject_id,
      runId: run.id,
      env,
    });
    if (agentResult.durationMs <= 0) {
      agentResult.durationMs = Date.now() - started;
    }
    await markRunCompleted(admin, run, agentResult);
    return { runId: run.id, status: "completed" };
  } catch (error) {
    return markRunFailed(admin, run, errorMessage(error));
  }
}

/**
 * Claims pending runs (RPC or single id) and processes each (**CI-1.2.2**).
 */
export async function processCompanyIntelligenceRuns(
  admin: SupabaseClient<Database>,
  params: ProcessCompanyIntelligenceRunsParams = {},
): Promise<ProcessCompanyIntelligenceRunsResult> {
  const { agentEnabled } = getCompanyIntelligenceFeatureFlags(params.env);
  if (!agentEnabled) {
    return { agentDisabled: true, outcomes: [] };
  }

  let runs: IntelligenceRunRow[] = [];
  if (params.runId) {
    const claimed = await claimRunById(admin, params.runId);
    if (claimed) {
      runs = [claimed];
    } else {
      return {
        agentDisabled: false,
        outcomes: [
          {
            runId: params.runId,
            status: "skipped",
            reason: "not_claimable",
          },
        ],
      };
    }
  } else {
    runs = await claimPendingBatch(
      admin,
      params.batchSize ?? COMPANY_INTEL_CRON_BATCH_SIZE_DEFAULT,
    );
  }

  const outcomes: ProcessCompanyIntelligenceRunOutcome[] = [];
  for (const run of runs) {
    outcomes.push(await processCompanyIntelligenceRun(admin, run, params.env));
  }

  return { agentDisabled: false, outcomes };
}
