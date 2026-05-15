import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Server-only Supabase key with elevated access (bypasses RLS via `service_role`).
 *
 * Prefer **`SUPABASE_SECRET_KEY`** (`sb_secret_…` from Dashboard → Settings → API Keys).
 * Supabase recommends secret keys over the legacy JWT **`service_role`** key: secret keys
 * block browser use and rotate without rotating the project JWT secret.
 *
 * @see https://supabase.com/docs/guides/api/api-keys
 */
export function getSupabaseAdminKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/** Thrown when neither `SUPABASE_SECRET_KEY` nor legacy `SUPABASE_SERVICE_ROLE_KEY` is set. */
export class SupabaseAdminKeyMissingError extends Error {
  constructor() {
    super(
      "SUPABASE_SECRET_KEY is not configured (legacy fallback: SUPABASE_SERVICE_ROLE_KEY)",
    );
    this.name = "SupabaseAdminKeyMissingError";
  }
}

/**
 * Supabase client for trusted server paths (anonymous funnel, merge, admin jobs).
 * Never import from `"use client"` or expose via `NEXT_PUBLIC_*`.
 */
export function createAdminClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabaseAdminKey();
  if (!url || !key) {
    throw new SupabaseAdminKeyMissingError();
  }
  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
