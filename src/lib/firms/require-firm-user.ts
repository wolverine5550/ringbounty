import { redirect } from "next/navigation";

import { loadFirmUserMembership } from "@/lib/firms/load-firm-user-membership";
import { createClient } from "@/lib/supabase/server";

import { FIRM_LANDING_PATH } from "./firm-portal-host";

export type FirmSessionContext = {
  authUserId: string;
  membership: NonNullable<Awaited<ReturnType<typeof loadFirmUserMembership>>>;
};

/**
 * Server guard for firm portal routes — requires Auth session + linked `firm_users` row.
 */
export async function requireFirmUser(
  redirectTo: string = FIRM_LANDING_PATH,
): Promise<FirmSessionContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    redirect(redirectTo);
  }

  const membership = await loadFirmUserMembership(supabase, user.id);
  if (!membership) {
    redirect(`${FIRM_LANDING_PATH}?error=not_linked`);
  }

  return { authUserId: user.id, membership };
}
