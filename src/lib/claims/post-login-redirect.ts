import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/** Anonymous funnel entry (marketing / first visit without an account). */
export const POST_LOGIN_CHECK_PATH = "/check";

/** Signed-in home — includes inline number screening and past searches. */
export const POST_LOGIN_DASHBOARD_PATH = "/dashboard";

/** Legacy starter template path — remapped to {@link resolvePostLoginRedirectPath}. */
export const LEGACY_PROTECTED_PATH = "/protected";

/**
 * Where to send a user immediately after sign-in when no explicit `next` applies
 * or when `next` is the legacy `/protected` route.
 */
export async function resolvePostLoginRedirectPath(
  _supabase: SupabaseClient<Database>,
  _userId: string,
): Promise<string> {
  return POST_LOGIN_DASHBOARD_PATH;
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
