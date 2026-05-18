import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/** Consumer screening entry when the user has no completed checks yet. */
export const POST_LOGIN_CHECK_PATH = "/check";

/** Home for returning users with at least one screened number on file. */
export const POST_LOGIN_DASHBOARD_PATH = "/dashboard";

/** Legacy starter template path — remapped to {@link resolvePostLoginRedirectPath}. */
export const LEGACY_PROTECTED_PATH = "/protected";

/**
 * Where to send a user immediately after sign-in when no explicit `next` applies
 * or when `next` is the legacy `/protected` route.
 */
export async function resolvePostLoginRedirectPath(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("claims")
    .select("id, claim_subjects ( id )")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const hasCompletedCheck = (data ?? []).some(
    (row) =>
      Array.isArray(row.claim_subjects) && row.claim_subjects.length > 0,
  );

  return hasCompletedCheck ? POST_LOGIN_DASHBOARD_PATH : POST_LOGIN_CHECK_PATH;
}

/**
 * True when `pathname` should be replaced with {@link resolvePostLoginRedirectPath}.
 */
export function isLegacyPostLoginPath(pathname: string): boolean {
  return (
    pathname === LEGACY_PROTECTED_PATH ||
    pathname.startsWith(`${LEGACY_PROTECTED_PATH}/`)
  );
}
