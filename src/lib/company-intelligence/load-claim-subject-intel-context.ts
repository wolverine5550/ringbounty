/**
 * CI-3.1 — Load subject metadata + auth context for Lane B orchestrator rounds.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

export type ClaimSubjectIntelContext = {
  metadata: Json | null;
  /** Row insert time — proxy for Lane A freshness (no `updated_at` on `claim_subjects`). */
  subjectCreatedAt: string | null;
  authenticatedUserId: string | null;
};

/**
 * Reads `claim_subjects` metadata and parent claim `user_id` for Round 2 + paid-round gating.
 */
export async function loadClaimSubjectIntelContext(
  admin: SupabaseClient<Database>,
  claimSubjectId: string,
): Promise<ClaimSubjectIntelContext> {
  const { data, error } = await admin
    .from("claim_subjects")
    .select("metadata, created_at, claims(user_id)")
    .eq("id", claimSubjectId)
    .maybeSingle();

  if (error) {
    throw new Error(`claim_subjects load failed: ${error.message}`);
  }

  const claimsRow = data?.claims;
  const userId =
    claimsRow &&
    typeof claimsRow === "object" &&
    "user_id" in claimsRow &&
    typeof claimsRow.user_id === "string"
      ? claimsRow.user_id
      : null;

  return {
    metadata: data?.metadata ?? null,
    subjectCreatedAt: data?.created_at ?? null,
    authenticatedUserId: userId,
  };
}
