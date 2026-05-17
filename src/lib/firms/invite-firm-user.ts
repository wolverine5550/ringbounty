import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveSiteOrigin } from "@/lib/stripe/connect/resolve-site-origin";
import type { Database } from "@/types/database";

import { FIRM_PORTAL_HOME_PATH } from "./firm-portal-host";

export type InviteFirmUserInput = {
  firmId: string;
  email: string;
  fullName?: string | null;
};

export type InviteFirmUserResult = {
  firmUserId: string;
  invited: boolean;
};

/**
 * Phase 13.4.2 — Ensures `firm_users` row exists and sends Supabase Auth invite email.
 */
export async function inviteFirmUser(
  admin: SupabaseClient<Database>,
  input: InviteFirmUserInput,
): Promise<InviteFirmUserResult> {
  const email = input.email.trim().toLowerCase();
  if (!email) {
    throw new Error("email_required");
  }

  const { data: existing, error: existingError } = await admin
    .from("firm_users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  let firmUserId = existing?.id;

  if (!firmUserId) {
    const { data: inserted, error: insertError } = await admin
      .from("firm_users")
      .insert({
        firm_id: input.firmId,
        email,
        full_name: input.fullName?.trim() || null,
      })
      .select("id")
      .single();

    if (insertError || !inserted?.id) {
      throw insertError ?? new Error("firm_user_insert_failed");
    }

    firmUserId = inserted.id;
  }

  const origin = resolveSiteOrigin();
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(FIRM_PORTAL_HOME_PATH)}`;

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: input.fullName?.trim()
      ? { full_name: input.fullName.trim() }
      : undefined,
  });

  if (inviteError) {
    throw inviteError;
  }

  return { firmUserId, invited: true };
}
