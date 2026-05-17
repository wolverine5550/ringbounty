import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type LinkFirmUserOnLoginResult =
  | { linked: true; firmUserId: string; firmId: string }
  | { linked: false; reason: "no_matching_row" | "already_linked" };

/**
 * Phase 13.4.2 — After Supabase Auth sign-in, bind `firm_users.auth_user_id` by email.
 * Ops pre-creates `firm_users` (or uses invite API); first login completes the link.
 */
export async function linkFirmUserOnLogin(
  admin: SupabaseClient<Database>,
  params: { authUserId: string; email: string },
): Promise<LinkFirmUserOnLoginResult> {
  const normalizedEmail = params.email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { linked: false, reason: "no_matching_row" };
  }

  const { data: row, error: fetchError } = await admin
    .from("firm_users")
    .select("id, firm_id, auth_user_id, email")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!row?.id) {
    return { linked: false, reason: "no_matching_row" };
  }

  if (row.auth_user_id && row.auth_user_id !== params.authUserId) {
    return { linked: false, reason: "already_linked" };
  }

  if (row.auth_user_id === params.authUserId) {
    return { linked: true, firmUserId: row.id, firmId: row.firm_id };
  }

  const { error: updateError } = await admin
    .from("firm_users")
    .update({ auth_user_id: params.authUserId })
    .eq("id", row.id)
    .is("auth_user_id", null);

  if (updateError) {
    throw updateError;
  }

  return { linked: true, firmUserId: row.id, firmId: row.firm_id };
}
