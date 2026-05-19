/**
 * CI-6.1.3 — When a callback child run identifies a company, upgrade the parent subject
 * suggestion with `callback_confirmed` confidence (90) and link parent run metadata.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { formatUsPhoneMask } from "@/lib/check/us-phone";
import { isSubstantiveCompanyName } from "@/lib/constants/company-identification";
import type { Database, Json } from "@/types/database";

import { SOURCE_CONFIDENCE } from "./confidence";
import { loadSubjectForIntelPersist } from "./persist-company-intelligence-outcome";
import type { RunCompanyIntelligenceAgentResult } from "./run-company-intelligence-agent";
import { writeBackSeedViolationFromAgent } from "./sources/seed-violations";

type IntelligenceRunRow =
  Database["public"]["Tables"]["company_intelligence_runs"]["Row"];

export type ApplyCallbackResolutionToParentParams = {
  admin: SupabaseClient<Database>;
  childRun: IntelligenceRunRow;
  agentResult: RunCompanyIntelligenceAgentResult;
};

export type ApplyCallbackResolutionToParentResult = {
  applied: boolean;
};

function mergeRunMetadata(
  existing: IntelligenceRunRow["run_metadata"],
  patch: Record<string, Json | undefined>,
): Json {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, Json | undefined>) }
      : {};
  return { ...base, ...patch };
}

/**
 * Patches parent `claim_subjects` suggest fields when callback lookup finds a substantive name.
 */
export async function applyCallbackResolutionToParent(
  params: ApplyCallbackResolutionToParentParams,
): Promise<ApplyCallbackResolutionToParentResult> {
  const { admin, childRun, agentResult } = params;
  const parentRunId = childRun.parent_run_id;
  if (!parentRunId) {
    return { applied: false };
  }

  const synthesis = agentResult.synthesis;
  const companyName = synthesis?.companyName?.trim() ?? "";
  if (!isSubstantiveCompanyName(companyName)) {
    return { applied: false };
  }

  const { data: parentRun, error: parentError } = await admin
    .from("company_intelligence_runs")
    .select("*")
    .eq("id", parentRunId)
    .maybeSingle();

  if (parentError) {
    throw parentError;
  }
  if (!parentRun) {
    return { applied: false };
  }

  const subject = await loadSubjectForIntelPersist(admin, parentRun.claim_subject_id);
  if (subject.companyIdentified) {
    return { applied: false };
  }

  const confidence = SOURCE_CONFIDENCE.callback_confirmed;
  const callbackDisplay = formatUsPhoneMask(childRun.phone_number_normalized);
  const reasoning = `Identified via callback number ${callbackDisplay}: ${synthesis!.reasoning}`;

  const { error: subjectError } = await admin
    .from("claim_subjects")
    .update({
      company_name_suggested: companyName,
      company_intel_confidence: confidence,
      company_intel_reasoning: reasoning,
    })
    .eq("id", parentRun.claim_subject_id);

  if (subjectError) {
    throw subjectError;
  }

  const { error: parentMetaError } = await admin
    .from("company_intelligence_runs")
    .update({
      run_metadata: mergeRunMetadata(parentRun.run_metadata, {
        callback_resolved_from: childRun.phone_number_normalized,
        callback_child_run_id: childRun.id,
        callback_resolved_company_name: companyName,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", parentRun.id);

  if (parentMetaError) {
    throw parentMetaError;
  }

  await writeBackSeedViolationFromAgent(admin, {
    phoneNumberNormalized: childRun.phone_number_normalized,
    companyName,
    confidence,
    claimSubjectId: parentRun.claim_subject_id,
    runId: childRun.id,
  });

  return { applied: true };
}
