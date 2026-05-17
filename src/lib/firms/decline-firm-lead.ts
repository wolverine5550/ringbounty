import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type DeclineFirmLeadInput = {
  firmId: string;
  leadId: string;
  reason?: string | null;
};

export type DeclineFirmLeadResult =
  | { declined: true }
  | { declined: false; reason: "lead_not_in_pool" };

/**
 * §13.5.3 — Per-firm decline; pool RLS hides the lead for this firm.
 */
export async function declineFirmLead(
  supabase: SupabaseClient<Database>,
  input: DeclineFirmLeadInput,
): Promise<DeclineFirmLeadResult> {
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id")
    .eq("id", input.leadId)
    .is("assigned_firm_id", null)
    .in("status", ["new", "reviewed"])
    .maybeSingle();

  if (leadError) {
    throw leadError;
  }

  if (!lead?.id) {
    return { declined: false, reason: "lead_not_in_pool" };
  }

  const reason = input.reason?.trim() || null;

  const { error: insertError } = await supabase.from("firm_lead_declines").insert({
    firm_id: input.firmId,
    lead_id: input.leadId,
    reason,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { declined: true };
    }
    throw insertError;
  }

  return { declined: true };
}
