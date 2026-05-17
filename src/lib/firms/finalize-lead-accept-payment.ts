import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type FinalizeLeadAcceptPaymentInput = {
  leadId: string;
  firmId: string;
  stripePaymentIntentId: string;
};

export type FinalizeLeadAcceptPaymentResult =
  | { status: "accepted"; leadId: string }
  | { status: "already_accepted"; leadId: string }
  | { status: "ignored"; reason: string };

/**
 * §13.5.2 — After `payment_intent.succeeded`, assign lead and unlock firm PII policies.
 */
export async function finalizeLeadAcceptPayment(
  admin: SupabaseClient<Database>,
  input: FinalizeLeadAcceptPaymentInput,
): Promise<FinalizeLeadAcceptPaymentResult> {
  const { data: lead, error: fetchError } = await admin
    .from("leads")
    .select("id, status, assigned_firm_id")
    .eq("id", input.leadId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!lead?.id) {
    return { status: "ignored", reason: "lead_not_found" };
  }

  if (lead.status === "accepted" && lead.assigned_firm_id === input.firmId) {
    return { status: "already_accepted", leadId: lead.id };
  }

  if (lead.assigned_firm_id && lead.assigned_firm_id !== input.firmId) {
    return { status: "ignored", reason: "assigned_to_other_firm" };
  }

  const acceptedAt = new Date().toISOString();

  const { data: updated, error: updateError } = await admin
    .from("leads")
    .update({
      status: "accepted",
      assigned_firm_id: input.firmId,
      accepted_at: acceptedAt,
      stripe_payment_intent_id: input.stripePaymentIntentId,
    })
    .eq("id", input.leadId)
    .eq("assigned_firm_id", input.firmId)
    .in("status", ["reviewed", "new"])
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  if (!updated?.id) {
    if (lead.status === "accepted") {
      return { status: "already_accepted", leadId: lead.id };
    }
    return { status: "ignored", reason: "update_noop" };
  }

  return { status: "accepted", leadId: updated.id };
}
