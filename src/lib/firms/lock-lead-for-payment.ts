import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type LockLeadForPaymentResult =
  | { locked: true; leadId: string; leadFeeCents: number }
  | { locked: false; reason: "not_available" | "already_assigned" };

/**
 * Reserves a pool lead for this firm while Stripe Checkout completes (§13.5.1).
 */
export async function lockLeadForPayment(
  admin: SupabaseClient<Database>,
  params: { leadId: string; firmId: string; leadFeeCents: number },
): Promise<LockLeadForPaymentResult> {
  const { data, error } = await admin
    .from("leads")
    .update({
      assigned_firm_id: params.firmId,
      status: "reviewed",
      lead_fee_cents: params.leadFeeCents,
    })
    .eq("id", params.leadId)
    .is("assigned_firm_id", null)
    .in("status", ["new", "reviewed"])
    .select("id, lead_fee_cents")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    const { data: existing } = await admin
      .from("leads")
      .select("assigned_firm_id")
      .eq("id", params.leadId)
      .maybeSingle();

    if (existing?.assigned_firm_id === params.firmId) {
      return {
        locked: true,
        leadId: params.leadId,
        leadFeeCents: params.leadFeeCents,
      };
    }

    return {
      locked: false,
      reason: existing?.assigned_firm_id ? "already_assigned" : "not_available",
    };
  }

  return {
    locked: true,
    leadId: data.id,
    leadFeeCents: data.lead_fee_cents ?? params.leadFeeCents,
  };
}
