/**
 * CI-8.1 — Qualify Screen 4 polling snapshot for Lane B suggest fields.
 *
 * Returns only UX-safe fields on `claim_subjects` (no `raw_results` / scrape payloads).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { CompanyIntelRunStatus } from "@/lib/company-intelligence/types";
import type { Database } from "@/types/database";

import { loadQualifyPageContext } from "./load-qualify-context";

/** API response shape for `GET /api/qualify/company-intel`. */
export type QualifyCompanyIntelSnapshot = {
  status: CompanyIntelRunStatus | null;
  company_name_suggested: string | null;
  confidence: number | null;
  reasoning: string | null;
};

const VALID_INTEL_STATUSES: readonly CompanyIntelRunStatus[] = [
  "pending",
  "running",
  "completed",
  "failed",
];

function parseCompanyIntelStatus(
  raw: string | null,
): CompanyIntelRunStatus | null {
  if (!raw) {
    return null;
  }
  return VALID_INTEL_STATUSES.includes(raw as CompanyIntelRunStatus)
    ? (raw as CompanyIntelRunStatus)
    : null;
}

/**
 * Loads suggest-only company intel fields when the subject is owned by `userId`.
 * Uses [`loadQualifyPageContext`] for the same auth gate as other qualify routes.
 */
export async function loadQualifyCompanyIntelSnapshot(
  supabase: SupabaseClient<Database>,
  params: { claimSubjectId: string; userId: string },
): Promise<QualifyCompanyIntelSnapshot | null> {
  const pageContext = await loadQualifyPageContext(supabase, params);
  if (!pageContext) {
    return null;
  }

  const { data, error } = await supabase
    .from("claim_subjects")
    .select(
      "company_intel_status, company_name_suggested, company_intel_confidence, company_intel_reasoning",
    )
    .eq("id", pageContext.subject.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    status: parseCompanyIntelStatus(data.company_intel_status),
    company_name_suggested: data.company_name_suggested,
    confidence: data.company_intel_confidence,
    reasoning: data.company_intel_reasoning,
  };
}
