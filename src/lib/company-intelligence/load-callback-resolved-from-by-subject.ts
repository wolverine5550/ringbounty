/**
 * CI-6.2.3 — Read parent run `run_metadata.callback_resolved_from` per claim subject.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

function parseCallbackResolvedFrom(runMetadata: unknown): string | null {
  if (!runMetadata || typeof runMetadata !== "object" || Array.isArray(runMetadata)) {
    return null;
  }
  const value = (runMetadata as Record<string, unknown>).callback_resolved_from;
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/**
 * Latest top-level intelligence run per subject that resolved company via callback.
 */
export async function loadCallbackResolvedFromBySubject(
  supabase: SupabaseClient<Database>,
  claimSubjectIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (claimSubjectIds.length === 0) {
    return out;
  }

  const { data, error } = await supabase
    .from("company_intelligence_runs")
    .select("claim_subject_id, run_metadata, updated_at")
    .in("claim_subject_id", claimSubjectIds)
    .is("parent_run_id", null)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  for (const row of data ?? []) {
    if (out.has(row.claim_subject_id)) {
      continue;
    }
    const resolved = parseCallbackResolvedFrom(row.run_metadata);
    if (resolved) {
      out.set(row.claim_subject_id, resolved);
    }
  }

  return out;
}
