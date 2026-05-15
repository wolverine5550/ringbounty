import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { ANONYMOUS_FUNNEL_ACTIVE_STATUSES } from "./anonymous-funnel-claim-status";

/** Default TCPA vertical — `public.violation_types` seed includes `tcpa`. */
export const DEFAULT_ANONYMOUS_VIOLATION_TYPE = "tcpa";

const POSTGRES_UNIQUE_VIOLATION = "23505";

/**
 * Returns the active anonymous funnel claim (`draft` **or** `checking`) for this session, or inserts **`draft`**.
 * Callers must pass an **admin** client (`createAdminClient` / secret key); RLS does not grant anon inserts on `claims`.
 *
 * Handles a rare race (two parallel inserts for the same session) by re-reading after
 * `claims_anonymous_session_unique` conflict.
 */
export async function createOrGetActiveClaimForSession(
  admin: SupabaseClient<Database>,
  anonymousSessionId: string,
  violationType: string = DEFAULT_ANONYMOUS_VIOLATION_TYPE,
): Promise<{ claimId: string }> {
  const existingId = await findActiveAnonymousFunnelClaimId(
    admin,
    anonymousSessionId,
  );
  if (existingId) {
    return { claimId: existingId };
  }

  const { data: inserted, error: insertError } = await admin
    .from("claims")
    .insert({
      anonymous_session_id: anonymousSessionId,
      user_id: null,
      violation_type: violationType,
      status: "draft",
    })
    .select("id")
    .single();

  if (!insertError && inserted?.id) {
    return { claimId: inserted.id };
  }

  if (insertError?.code === POSTGRES_UNIQUE_VIOLATION) {
    const afterRace = await findActiveAnonymousFunnelClaimId(
      admin,
      anonymousSessionId,
    );
    if (afterRace) {
      return { claimId: afterRace };
    }
  }

  throw insertError ?? new Error("Failed to create anonymous claim");
}

async function findActiveAnonymousFunnelClaimId(
  admin: SupabaseClient<Database>,
  anonymousSessionId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from("claims")
    .select("id")
    .eq("anonymous_session_id", anonymousSessionId)
    .is("user_id", null)
    .in("status", [...ANONYMOUS_FUNNEL_ACTIVE_STATUSES])
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data?.id ?? null;
}
