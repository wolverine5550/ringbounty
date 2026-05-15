import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type MergeAnonymousDraftResult = {
  /** Claim id the user should continue with (merged or pre-existing owned draft). */
  mergedClaimId: string | null;
  /** Anonymous draft was dropped because the user already had an owned draft. */
  collisionAbandoned?: boolean;
};

/**
 * Collision rule (§2.6.4 — v0):
 *
 * - If the user **already owns** a `draft` claim, we **abandon** the anonymous draft
 *   (delete the anonymous-only row; subjects cascade). The user continues with their
 *   existing owned draft. Rationale: one active draft per user until product defines
 *   multi-draft or subject-merge rules.
 * - Otherwise we attach the anonymous draft: `user_id = auth.uid()`, clear
 *   `anonymous_session_id`.
 *
 * `public.users` is expected from the auth sync trigger (§1.4.3). If missing, we
 * upsert a minimal profile from Auth admin API so FK on `claims.user_id` succeeds.
 *
 * **Note:** Steps are sequential via the admin client, not a single DB transaction.
 * A future RPC can wrap this in `BEGIN … COMMIT` if we need strict atomicity.
 */
export async function mergeAnonymousDraftOnLogin(
  admin: SupabaseClient<Database>,
  params: { authUserId: string; anonymousSessionId: string },
): Promise<MergeAnonymousDraftResult> {
  await ensurePublicUserRow(admin, params.authUserId);

  const existingOwnedDraftId = await findOwnedDraftClaimId(
    admin,
    params.authUserId,
  );

  const anonymousClaimId = await findAnonymousDraftClaimId(
    admin,
    params.anonymousSessionId,
  );

  if (!anonymousClaimId) {
    return { mergedClaimId: existingOwnedDraftId };
  }

  if (existingOwnedDraftId) {
    await abandonAnonymousDraft(admin, anonymousClaimId);
    return {
      mergedClaimId: existingOwnedDraftId,
      collisionAbandoned: true,
    };
  }

  const { data, error } = await admin
    .from("claims")
    .update({
      user_id: params.authUserId,
      anonymous_session_id: null,
    })
    .eq("id", anonymousClaimId)
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

async function findOwnedDraftClaimId(
  admin: SupabaseClient<Database>,
  authUserId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from("claims")
    .select("id")
    .eq("user_id", authUserId)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data?.id ?? null;
}

async function findAnonymousDraftClaimId(
  admin: SupabaseClient<Database>,
  anonymousSessionId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from("claims")
    .select("id")
    .eq("anonymous_session_id", anonymousSessionId)
    .is("user_id", null)
    .eq("status", "draft")
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data?.id ?? null;
}

async function abandonAnonymousDraft(
  admin: SupabaseClient<Database>,
  anonymousClaimId: string,
): Promise<void> {
  const { error } = await admin.from("claims").delete().eq("id", anonymousClaimId);
  if (error) {
    throw error;
  }
}

/**
 * Guarantees `public.users` exists before attaching `claims.user_id` (§2.6.2).
 */
async function ensurePublicUserRow(
  admin: SupabaseClient<Database>,
  authUserId: string,
): Promise<void> {
  const { data: existing, error: selectError } = await admin
    .from("users")
    .select("id")
    .eq("id", authUserId)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }
  if (existing?.id) {
    return;
  }

  const { data: authData, error: authError } =
    await admin.auth.admin.getUserById(authUserId);

  if (authError) {
    throw authError;
  }

  const email = authData.user.email;
  if (!email) {
    throw new Error("Cannot create public.users row without auth email");
  }

  const meta = authData.user.user_metadata as Record<string, unknown> | undefined;
  const fullName =
    typeof meta?.full_name === "string"
      ? meta.full_name
      : typeof meta?.name === "string"
        ? meta.name
        : null;

  const { error: upsertError } = await admin.from("users").upsert({
    id: authUserId,
    email,
    full_name: fullName,
  });

  if (upsertError) {
    throw upsertError;
  }
}
