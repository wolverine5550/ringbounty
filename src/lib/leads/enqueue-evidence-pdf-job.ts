/**
 * Phase 13.1.3 / 13.2 — Queue evidence PDF generation for a new lead.
 * v0.1: persist queue marker only; PDF compiler ships in §13.2.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ATTORNEY_REFERRAL_EVENT_KEYS,
  ATTORNEY_REFERRAL_EVENT_TYPE,
  EVIDENCE_PDF_JOB_QUEUED,
} from "@/lib/leads/attorney-referral-claim-events";
import type { Database } from "@/types/database";

/**
 * Records that an evidence PDF should be built for `leadId` (§13.2 worker TBD).
 */
export async function enqueueEvidencePdfJob(
  admin: SupabaseClient<Database>,
  params: { claimId: string; leadId: string },
): Promise<void> {
  const { error } = await admin.from("claim_events").insert({
    claim_id: params.claimId,
    event_type: ATTORNEY_REFERRAL_EVENT_TYPE,
    key: ATTORNEY_REFERRAL_EVENT_KEYS.evidencePdfJobStatus,
    value: EVIDENCE_PDF_JOB_QUEUED,
    source: "system",
  });

  if (error) {
    throw error;
  }
}
