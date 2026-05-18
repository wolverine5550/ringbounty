/**
 * Phase 13.8 — `claim_events` keys for firm contact disputes on a lead.
 */

import type { ClaimEventType } from "@/lib/constants/claimEvent";

export const FIRM_LEAD_DISPUTE_EVENT_TYPE: ClaimEventType = "firm_lead_dispute";

export const FIRM_LEAD_DISPUTE_EVENT_KEYS = {
  leadId: "lead_id",
  reason: "reason",
  details: "details",
  opsEmailStatus: "ops_email_status",
} as const;
