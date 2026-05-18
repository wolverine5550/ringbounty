import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/** Firm-updatable pipeline statuses after paid accept (§13.6.1). */
export const FIRM_LEAD_STATUS_TARGETS = ["contacted", "retained", "closed"] as const;

export type FirmLeadStatusTarget = (typeof FIRM_LEAD_STATUS_TARGETS)[number];

const ALLOWED_FROM: Record<FirmLeadStatusTarget, readonly string[]> = {
  contacted: ["accepted"],
  retained: ["contacted"],
  closed: ["accepted", "contacted", "retained"],
};

export type UpdateFirmLeadStatusInput = {
  leadId: string;
  firmId: string;
  status: FirmLeadStatusTarget;
};

export type UpdateFirmLeadStatusResult =
  | { updated: true; status: FirmLeadStatusTarget }
  | {
      updated: false;
      reason: "lead_not_found" | "invalid_transition" | "not_assigned";
    };

function buildTimestampPatch(
  status: FirmLeadStatusTarget,
  now: string,
): Pick<
  Database["public"]["Tables"]["leads"]["Update"],
  "status" | "contacted_at" | "retained_at" | "closed_at"
> {
  const patch: Pick<
    Database["public"]["Tables"]["leads"]["Update"],
    "status" | "contacted_at" | "retained_at" | "closed_at"
  > = { status };

  if (status === "contacted") {
    patch.contacted_at = now;
  } else if (status === "retained") {
    patch.retained_at = now;
  } else if (status === "closed") {
    patch.closed_at = now;
  }

  return patch;
}

/**
 * §13.6.1 — Advance assigned lead status; sets the matching `*_at` timestamp.
 */
export async function updateFirmLeadStatus(
  supabase: SupabaseClient<Database>,
  input: UpdateFirmLeadStatusInput,
): Promise<UpdateFirmLeadStatusResult> {
  const { data: lead, error: fetchError } = await supabase
    .from("leads")
    .select("id, status, assigned_firm_id")
    .eq("id", input.leadId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!lead?.id) {
    return { updated: false, reason: "lead_not_found" };
  }

  if (lead.assigned_firm_id !== input.firmId) {
    return { updated: false, reason: "not_assigned" };
  }

  if (!ALLOWED_FROM[input.status].includes(lead.status)) {
    return { updated: false, reason: "invalid_transition" };
  }

  const now = new Date().toISOString();
  const patch = buildTimestampPatch(input.status, now);

  const { data: updated, error: updateError } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", input.leadId)
    .eq("assigned_firm_id", input.firmId)
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  if (!updated?.id) {
    return { updated: false, reason: "lead_not_found" };
  }

  return { updated: true, status: input.status };
}
