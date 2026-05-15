import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { RESULTS_PATH } from "./gated-routes";

/**
 * After a successful anonymous → authenticated merge (§2.6.5), send the user to
 * `/results?claim=<id>` when they have subjects, otherwise `/results?claim=<id>`
 * (qualify deep links can be added when Phase 7 ships).
 */
export async function resolvePostMergeRedirectPath(
  admin: SupabaseClient<Database>,
  claimId: string,
): Promise<string> {
  const { count, error } = await admin
    .from("claim_subjects")
    .select("id", { count: "exact", head: true })
    .eq("claim_id", claimId);

  if (error) {
    throw error;
  }

  const url = new URL(RESULTS_PATH, "http://local");
  url.searchParams.set("claim", claimId);

  // When exactly one subject exists, future work may deep-link to `/qualify/[id]`.
  if (count === 1) {
    const { data: subject, error: subjectError } = await admin
      .from("claim_subjects")
      .select("id")
      .eq("claim_id", claimId)
      .limit(1)
      .maybeSingle();

    if (subjectError) {
      throw subjectError;
    }
    if (subject?.id) {
      url.searchParams.set("subject", subject.id);
    }
  }

  return `${url.pathname}${url.search}`;
}
