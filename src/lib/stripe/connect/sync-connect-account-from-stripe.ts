import type { Stripe } from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Persists Connect readiness flags from a Stripe Account onto `law_firms`.
 */
export async function syncConnectAccountFromStripe(
  admin: SupabaseClient<Database>,
  account: Stripe.Account,
): Promise<{ updated: boolean; firmId: string | null }> {
  const accountId = account.id;
  if (!accountId) {
    return { updated: false, firmId: null };
  }

  const { data: firm, error: fetchError } = await admin
    .from("law_firms")
    .select("id")
    .eq("stripe_connect_account_id", accountId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!firm?.id) {
    return { updated: false, firmId: null };
  }

  const { error: updateError } = await admin
    .from("law_firms")
    .update({
      stripe_connect_charges_enabled: account.charges_enabled === true,
      stripe_connect_details_submitted: account.details_submitted === true,
    })
    .eq("id", firm.id);

  if (updateError) {
    throw updateError;
  }

  return { updated: true, firmId: firm.id };
}
