import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/** Consumer-visible lead status snapshot (§13.6.2). */
export type ConsumerLeadStatus = {
  leadId: string;
  claimId: string;
  status: string;
  assignedFirmId: string | null;
  acceptedAt: string | null;
  contactedAt: string | null;
  retainedAt: string | null;
  closedAt: string | null;
};

/**
 * Loads the latest lead row for a claim owned by the signed-in consumer (RLS).
 */
export async function loadConsumerLeadStatus(
  supabase: SupabaseClient<Database>,
  params: { claimId: string; userId: string },
): Promise<ConsumerLeadStatus | null> {
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, claim_id, status, assigned_firm_id, accepted_at, contacted_at, retained_at, closed_at, user_id",
    )
    .eq("claim_id", params.claimId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id || data.user_id !== params.userId) {
    return null;
  }

  return {
    leadId: data.id,
    claimId: data.claim_id,
    status: data.status,
    assignedFirmId: data.assigned_firm_id,
    acceptedAt: data.accepted_at,
    contactedAt: data.contacted_at,
    retainedAt: data.retained_at,
    closedAt: data.closed_at,
  };
}
