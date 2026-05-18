import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  FIRM_LEAD_DISPUTE_EVENT_KEYS,
  FIRM_LEAD_DISPUTE_EVENT_TYPE,
} from "./firm-contact-dispute-claim-events";

/**
 * §13.8 — Whether the consumer already filed a firm-contact dispute for this lead.
 */
export async function loadFirmContactDisputeSubmitted(
  supabase: SupabaseClient<Database>,
  params: { claimId: string; leadId: string },
): Promise<boolean> {
  const { data, error } = await supabase
    .from("claim_events")
    .select("id")
    .eq("claim_id", params.claimId)
    .eq("event_type", FIRM_LEAD_DISPUTE_EVENT_TYPE)
    .eq("key", FIRM_LEAD_DISPUTE_EVENT_KEYS.leadId)
    .eq("value", params.leadId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.id);
}
