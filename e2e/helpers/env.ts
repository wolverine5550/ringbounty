/**
 * CI-8.5 — Hosted Supabase + password test user required for qualify Screen 4 E2E.
 */

/** True when env has credentials to seed fixtures and run authenticated browser tests. */
export function hasQualifyScreen4E2EEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() &&
      getSupabaseAdminKey()?.trim() &&
      process.env.E2E_USER_EMAIL?.trim() &&
      process.env.E2E_USER_PASSWORD?.trim(),
  );
}

/** Admin key for fixture seeding (matches `src/lib/supabase/admin.ts`). */
export function getSupabaseAdminKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() ??
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

export function getE2EUserEmail(): string {
  const email = process.env.E2E_USER_EMAIL?.trim();
  if (!email) {
    throw new Error("E2E_USER_EMAIL is not set");
  }
  return email;
}

export function getE2EUserPassword(): string {
  const password = process.env.E2E_USER_PASSWORD?.trim();
  if (!password) {
    throw new Error("E2E_USER_PASSWORD is not set");
  }
  return password;
}
