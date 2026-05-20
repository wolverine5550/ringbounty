/**
 * CI-8.4.2 — Latest completed top-level intelligence run per subject for evidence PDF.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  type CompanyIntelEvidenceSnapshot,
  parseCompanyIntelRoundAudits,
} from "./format-company-intel-evidence";

type RunRow = Pick<
  Database["public"]["Tables"]["company_intelligence_runs"]["Row"],
  | "claim_subject_id"
  | "status"
  | "sources_queried"
  | "synthesized_company_name"
  | "synthesized_confidence"
  | "synthesized_reasoning"
  | "apis_called"
  | "updated_at"
>;

function buildSnapshot(
  run: RunRow,
  subjectReasoning: string | null,
): CompanyIntelEvidenceSnapshot {
  return {
    suggestedCompanyName: run.synthesized_company_name,
    confidence: run.synthesized_confidence,
    reasoning: run.synthesized_reasoning ?? subjectReasoning,
    roundAudits: parseCompanyIntelRoundAudits(run.sources_queried),
    apisCalled: run.apis_called,
  };
}

/**
 * Loads the newest completed parent run per subject (excludes callback child runs).
 */
export async function loadCompanyIntelEvidenceBySubject(
  supabase: SupabaseClient<Database>,
  params: {
    claimSubjectIds: string[];
    /** Fallback when run `synthesized_reasoning` is null (e.g. failed synthesis). */
    subjectReasoningById?: Map<string, string | null>;
  },
): Promise<Map<string, CompanyIntelEvidenceSnapshot>> {
  const out = new Map<string, CompanyIntelEvidenceSnapshot>();
  if (params.claimSubjectIds.length === 0) {
    return out;
  }

  const { data, error } = await supabase
    .from("company_intelligence_runs")
    .select(
      "claim_subject_id, status, sources_queried, synthesized_company_name, synthesized_confidence, synthesized_reasoning, apis_called, updated_at",
    )
    .in("claim_subject_id", params.claimSubjectIds)
    .eq("status", "completed")
    .is("parent_run_id", null)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  for (const row of (data ?? []) as RunRow[]) {
    if (out.has(row.claim_subject_id)) {
      continue;
    }
    const subjectReasoning =
      params.subjectReasoningById?.get(row.claim_subject_id) ?? null;
    out.set(
      row.claim_subject_id,
      buildSnapshot(row, subjectReasoning),
    );
  }

  // Subject-only reasoning when agent completed before run row was linked (edge) or run missing.
  if (params.subjectReasoningById) {
    for (const [subjectId, reasoning] of params.subjectReasoningById) {
      if (out.has(subjectId) || !reasoning?.trim()) {
        continue;
      }
      out.set(subjectId, {
        suggestedCompanyName: null,
        confidence: null,
        reasoning: reasoning.trim(),
        roundAudits: [],
        apisCalled: null,
      });
    }
  }

  return out;
}
