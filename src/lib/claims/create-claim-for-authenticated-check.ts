import type { SupabaseClient } from "@supabase/supabase-js";

import type { DedupedPhoneEntry } from "@/lib/check/us-phone";
import type { Database } from "@/types/database";

import { DEFAULT_ANONYMOUS_VIOLATION_TYPE } from "./create-or-get-active-claim-for-session";

/**
 * Inserts a new owned claim + subjects for a signed-in dashboard check.
 * Each submit is a separate search row (does not reuse anonymous session drafts).
 */
export async function createClaimWithSubjectsForAuthenticatedUser(
  admin: SupabaseClient<Database>,
  userId: string,
  entries: DedupedPhoneEntry[],
): Promise<{ claimId: string; subjectIds: string[] }> {
  const { data: claim, error: claimError } = await admin
    .from("claims")
    .insert({
      user_id: userId,
      anonymous_session_id: null,
      violation_type: DEFAULT_ANONYMOUS_VIOLATION_TYPE,
      status: "draft",
    })
    .select("id")
    .single();

  if (claimError || !claim?.id) {
    throw claimError ?? new Error("Failed to create authenticated claim");
  }

  const claimId = claim.id;

  if (entries.length === 0) {
    return { claimId, subjectIds: [] };
  }

  const { data: inserted, error: insertError } = await admin
    .from("claim_subjects")
    .insert(
      entries.map((e) => ({
        claim_id: claimId,
        phone_number: e.phoneNumberDisplay,
        phone_number_normalized: e.phoneNumberNormalized,
      })),
    )
    .select("id");

  if (insertError) {
    throw insertError;
  }

  const subjectIds =
    inserted?.map((row) => row.id).filter((id): id is string => !!id) ?? [];
  if (subjectIds.length !== entries.length) {
    throw new Error("claim_subjects insert row count mismatch");
  }

  const { error: statusError } = await admin
    .from("claims")
    .update({ status: "checking" })
    .eq("id", claimId);

  if (statusError) {
    throw statusError;
  }

  return { claimId, subjectIds };
}
