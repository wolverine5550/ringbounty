/**
 * Phase 13.8.1 — Persist consumer firm-contact dispute on `claim_events` for a lead.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  FIRM_CONTACT_DISPUTE_DETAILS_MAX_LENGTH,
  FIRM_CONTACT_DISPUTE_REASONS,
  type FirmContactDisputeReason,
} from "@/lib/constants/firm-contact-dispute";
import type { Database } from "@/types/database";

import {
  FIRM_LEAD_DISPUTE_EVENT_KEYS,
  FIRM_LEAD_DISPUTE_EVENT_TYPE,
} from "./firm-contact-dispute-claim-events";
import { loadFirmContactDisputeSubmitted } from "./load-firm-contact-dispute-submitted";
import { sendFirmContactDisputeOpsEmail } from "./send-firm-contact-dispute-ops-email";

/** Lead statuses where a firm has accepted and may have contacted the consumer. */
const DISPUTE_ELIGIBLE_STATUSES = [
  "accepted",
  "contacted",
  "retained",
  "closed",
] as const;

export type RecordFirmContactDisputeInput = {
  leadId: string;
  userId: string;
  userEmail: string | null | undefined;
  reason: FirmContactDisputeReason;
  details?: string | null;
};

export type RecordFirmContactDisputeResult =
  | { recorded: true }
  | {
      recorded: false;
      reason:
        | "lead_not_found"
        | "not_owner"
        | "not_eligible"
        | "already_submitted"
        | "invalid_reason"
        | "details_too_long";
    };

export function isFirmContactDisputeReason(
  value: unknown,
): value is FirmContactDisputeReason {
  return (
    typeof value === "string" &&
    (FIRM_CONTACT_DISPUTE_REASONS as readonly string[]).includes(value)
  );
}

export function normalizeFirmContactDisputeDetails(
  raw: string | null | undefined,
): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > FIRM_CONTACT_DISPUTE_DETAILS_MAX_LENGTH) {
    return null;
  }
  return trimmed;
}

/**
 * Validates lead ownership, appends dispute `claim_events`, and emails ops when configured.
 */
export async function recordFirmContactDispute(
  userSupabase: SupabaseClient<Database>,
  admin: SupabaseClient<Database>,
  input: RecordFirmContactDisputeInput,
): Promise<RecordFirmContactDisputeResult> {
  if (!isFirmContactDisputeReason(input.reason)) {
    return { recorded: false, reason: "invalid_reason" };
  }

  const details = normalizeFirmContactDisputeDetails(input.details);
  if (input.details?.trim() && details === null) {
    return { recorded: false, reason: "details_too_long" };
  }

  const { data: lead, error: leadError } = await userSupabase
    .from("leads")
    .select("id, claim_id, user_id, status, assigned_firm_id")
    .eq("id", input.leadId)
    .maybeSingle();

  if (leadError) {
    throw leadError;
  }

  if (!lead?.id) {
    return { recorded: false, reason: "lead_not_found" };
  }

  if (lead.user_id !== input.userId) {
    return { recorded: false, reason: "not_owner" };
  }

  if (
    !lead.assigned_firm_id ||
    !(DISPUTE_ELIGIBLE_STATUSES as readonly string[]).includes(lead.status)
  ) {
    return { recorded: false, reason: "not_eligible" };
  }

  const alreadySubmitted = await loadFirmContactDisputeSubmitted(userSupabase, {
    claimId: lead.claim_id,
    leadId: lead.id,
  });

  if (alreadySubmitted) {
    return { recorded: false, reason: "already_submitted" };
  }

  const eventRows: Database["public"]["Tables"]["claim_events"]["Insert"][] = [
    {
      claim_id: lead.claim_id,
      event_type: FIRM_LEAD_DISPUTE_EVENT_TYPE,
      key: FIRM_LEAD_DISPUTE_EVENT_KEYS.leadId,
      value: lead.id,
      source: "user_input",
    },
    {
      claim_id: lead.claim_id,
      event_type: FIRM_LEAD_DISPUTE_EVENT_TYPE,
      key: FIRM_LEAD_DISPUTE_EVENT_KEYS.reason,
      value: input.reason,
      source: "user_input",
    },
  ];

  if (details) {
    eventRows.push({
      claim_id: lead.claim_id,
      event_type: FIRM_LEAD_DISPUTE_EVENT_TYPE,
      key: FIRM_LEAD_DISPUTE_EVENT_KEYS.details,
      value: details,
      source: "user_input",
    });
  }

  const { error: insertError } = await userSupabase
    .from("claim_events")
    .insert(eventRows);

  if (insertError) {
    throw insertError;
  }

  let firmName: string | null = null;
  if (lead.assigned_firm_id) {
    const { data: firm } = await admin
      .from("law_firms")
      .select("name")
      .eq("id", lead.assigned_firm_id)
      .maybeSingle();
    firmName = firm?.name ?? null;
  }

  await sendFirmContactDisputeOpsEmail(admin, {
    claimId: lead.claim_id,
    leadId: lead.id,
    reason: input.reason,
    details,
    userEmail: input.userEmail,
    firmName,
  });

  return { recorded: true };
}

/**
 * Whether the consumer can file a firm-contact dispute for this lead snapshot.
 */
export function canReportFirmContactIssue(lead: {
  status: string;
  assignedFirmId: string | null;
  disputeSubmitted: boolean;
}): boolean {
  if (lead.disputeSubmitted) {
    return false;
  }
  if (!lead.assignedFirmId) {
    return false;
  }
  return (DISPUTE_ELIGIBLE_STATUSES as readonly string[]).includes(lead.status);
}
