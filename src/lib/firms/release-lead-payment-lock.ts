import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Releases a payment-pending lock when Checkout is cancelled or fails (§13.5.1).
 */
export async function releaseLeadPaymentLock(
  admin: SupabaseClient<Database>,
  params: { leadId: string; firmId: string },
): Promise<boolean> {
  const { data, error } = await admin
    .from("leads")
    .update({
      assigned_firm_id: null,
      status: "new",
      stripe_payment_intent_id: null,
      lead_fee_cents: null,
    })
    .eq("id", params.leadId)
    .eq("assigned_firm_id", params.firmId)
    .eq("status", "reviewed")
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.id);
}
