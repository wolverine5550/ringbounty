import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import type { FirmLeadListRow } from "./apply-firm-lead-filters";

type LeadUserJoin = {
  email: string;
  full_name: string | null;
};

type LeadSelectRow = {
  id: string;
  status: string;
  claim_strength: string | null;
  estimated_value_realistic_cents: number | null;
  estimated_value_low_cents: number | null;
  violation_type: string;
  assigned_firm_id: string | null;
  created_at: string;
  consumer_state: string | null;
  evidence_pdf_url: string | null;
  users: LeadUserJoin | LeadUserJoin[] | null;
};

/**
 * Loads leads visible to the firm via RLS (pool + assigned).
 * Consumer PII (email, name) is available only after paid accept (§13.5.2 RLS).
 */
export async function loadFirmLeads(
  supabase: SupabaseClient<Database>,
): Promise<FirmLeadListRow[]> {
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, status, claim_strength, estimated_value_realistic_cents, estimated_value_low_cents, violation_type, assigned_firm_id, created_at, consumer_state, evidence_pdf_url, users(email, full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const typed = row as LeadSelectRow;
    const userJoin = Array.isArray(typed.users) ? typed.users[0] : typed.users;

    return {
      id: typed.id,
      status: typed.status,
      claim_strength: typed.claim_strength,
      estimated_value_realistic_cents: typed.estimated_value_realistic_cents,
      estimated_value_low_cents: typed.estimated_value_low_cents,
      violation_type: typed.violation_type,
      assigned_firm_id: typed.assigned_firm_id,
      created_at: typed.created_at,
      consumer_state: typed.consumer_state ?? null,
      consumer_email: userJoin?.email ?? null,
      consumer_full_name: userJoin?.full_name ?? null,
      evidence_pdf_url: typed.evidence_pdf_url,
    };
  });
}
