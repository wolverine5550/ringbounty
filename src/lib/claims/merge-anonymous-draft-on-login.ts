import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Attaches a pre-login **draft** anonymous claim to the authenticated user.
 *
 * **Collision / duplicates (§2.6.4 stub):** We only merge rows matching this
 * `anonymous_session_id` with `user_id is null`. If the user already owns other
 * claims, this row becomes an additional owned draft — product can later define
 * “single active draft” rules in §2.6.
 */
export async function mergeAnonymousDraftOnLogin(
  admin: SupabaseClient<Database>,
  params: { authUserId: string; anonymousSessionId: string },
): Promise<{ mergedClaimId: string | null }> {
  const { data, error } = await admin
    .from("claims")
    .update({
      user_id: params.authUserId,
      anonymous_session_id: null,
    })
    .eq("anonymous_session_id", params.anonymousSessionId)
    .is("user_id", null)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }
  return { mergedClaimId: data?.id ?? null };
}
