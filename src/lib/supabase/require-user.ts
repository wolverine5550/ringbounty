import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Server-only guard: validates the JWT via `getClaims()` (per Supabase SSR guidance)
 * and redirects unauthenticated visitors. Use in Server Components / layouts — not in
 * the browser `proxy` (that path already uses `getClaims()`).
 */
export async function requireUser(redirectTo: string = "/login") {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect(redirectTo);
  }

  return data.claims;
}
