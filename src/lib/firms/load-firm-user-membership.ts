import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type FirmUserMembership = {
  firmUserId: string;
  firmId: string;
  email: string;
};

/**
 * Loads the signed-in user's `firm_users` row (RLS: `firm_users_select_self`).
 */
export async function loadFirmUserMembership(
  supabase: SupabaseClient<Database>,
  authUserId: string,
): Promise<FirmUserMembership | null> {
  const { data, error } = await supabase
    .from("firm_users")
    .select("id, firm_id, email")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.firm_id) {
    return null;
  }

  return {
    firmUserId: data.id,
    firmId: data.firm_id,
    email: data.email,
  };
}
