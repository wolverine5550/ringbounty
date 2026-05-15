import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { ANONYMOUS_FUNNEL_ACTIVE_STATUSES } from "./anonymous-funnel-claim-status";
import {
  getEmailCaptureTrigger,
  type EmailCaptureReason,
} from "./email-capture-trigger";
import {
  isSuccessfulQuery,
  type ClaimQuerySnapshot,
  type ClaimStrengthGate,
} from "./successful-query";

export type ClaimGateStatus = {
  claimId: string;
  snapshot: ClaimQuerySnapshot;
  isSuccessfulQuery: boolean;
  /** True when anonymous user must sign in before viewing gated routes. */
  requiresAccountWall: boolean;
  /** Offer waitlist signup for ineligible / exempt-only (§2.8.4). */
  showEmailCapture: boolean;
  emailCaptureReason: EmailCaptureReason | null;
};

/**
 * Loads persisted claim + subject rows for the successful-query gate (§2.2 / §2.5).
 * Uses the admin client because anonymous rows are not readable via anon/authenticated RLS.
 */
export async function loadClaimGateStatusByClaimId(
  admin: SupabaseClient<Database>,
  claimId: string,
): Promise<ClaimGateStatus | null> {
  const { data: claim, error: claimError } = await admin
    .from("claims")
    .select("id, claim_strength")
    .eq("id", claimId)
    .maybeSingle();

  if (claimError) {
    throw claimError;
  }
  if (!claim?.id) {
    return null;
  }

  const { data: subjects, error: subjectsError } = await admin
    .from("claim_subjects")
    .select("is_exempt, call_category, spam_db_complaint_count")
    .eq("claim_id", claimId);

  if (subjectsError) {
    throw subjectsError;
  }

  const snapshot: ClaimQuerySnapshot = {
    claim: {
      claim_strength: claim.claim_strength as ClaimStrengthGate,
    },
    subjects: (subjects ?? []).map((row) => ({
      is_exempt: row.is_exempt,
      call_category: row.call_category,
      spam_db_complaint_count: row.spam_db_complaint_count,
    })),
  };

  const successful = isSuccessfulQuery(snapshot);
  const emailCapture = getEmailCaptureTrigger(snapshot);
  return {
    claimId: claim.id,
    snapshot,
    isSuccessfulQuery: successful,
    requiresAccountWall: successful,
    showEmailCapture: emailCapture.showEmailCapture,
    emailCaptureReason: emailCapture.emailCaptureReason,
  };
}

/**
 * Resolves the active anonymous funnel claim (`draft` or `checking`) for a session cookie value.
 */
export async function loadAnonymousDraftGateStatus(
  admin: SupabaseClient<Database>,
  anonymousSessionId: string,
): Promise<ClaimGateStatus | null> {
  const { data: claim, error } = await admin
    .from("claims")
    .select("id")
    .eq("anonymous_session_id", anonymousSessionId)
    .is("user_id", null)
    .in("status", [...ANONYMOUS_FUNNEL_ACTIVE_STATUSES])
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!claim?.id) {
    return null;
  }

  return loadClaimGateStatusByClaimId(admin, claim.id);
}
