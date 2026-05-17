/**
 * Phase 13.1.3 — Create `leads` row after server-side {@link canReferToAttorney} checks.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  canReferToAttorney,
  AttorneyReferralNotAllowedError,
} from "@/lib/claims/can-refer-to-attorney";
import type { ClaimStrengthGate } from "@/lib/claims/successful-query";
import {
  ATTORNEY_REFERRAL_EVENT_KEYS,
  ATTORNEY_REFERRAL_EVENT_TYPE,
} from "@/lib/leads/attorney-referral-claim-events";
import { runEvidencePdfJob } from "@/lib/leads/run-evidence-pdf-job";
import { sendAttorneyReferralConfirmation } from "@/lib/leads/send-attorney-referral-confirmation";
import type { Database } from "@/types/database";

/** Active pipeline statuses — one open lead per claim in v0.1. */
const ACTIVE_LEAD_STATUSES = [
  "new",
  "reviewed",
  "accepted",
  "contacted",
  "retained",
] as const;

export type CreateAttorneyLeadInput = {
  claimId: string;
  userId: string;
  userEmail: string | null | undefined;
  leadSharingConsent: boolean;
};

export type CreateAttorneyLeadResult =
  | { status: "created"; leadId: string }
  | { status: "already_submitted"; leadId: string };

export class AttorneyReferralConsentRequiredError extends Error {
  constructor() {
    super("Lead sharing consent is required");
    this.name = "AttorneyReferralConsentRequiredError";
  }
}

/**
 * Inserts `leads` via admin client after ownership + eligibility validation on `userSupabase`.
 */
export async function createAttorneyLead(
  userSupabase: SupabaseClient<Database>,
  admin: SupabaseClient<Database>,
  input: CreateAttorneyLeadInput,
): Promise<CreateAttorneyLeadResult> {
  if (!input.leadSharingConsent) {
    throw new AttorneyReferralConsentRequiredError();
  }

  const { data: claim, error: claimError } = await userSupabase
    .from("claims")
    .select(
      "id, user_id, violation_type, claim_strength, estimated_value_low_cents, estimated_value_high_cents, estimated_value_realistic_cents",
    )
    .eq("id", input.claimId)
    .maybeSingle();

  if (claimError) {
    throw claimError;
  }

  if (!claim?.id || claim.user_id !== input.userId) {
    throw new AttorneyReferralNotAllowedError(["claim_ineligible"]);
  }

  const { data: subjects, error: subjectsError } = await userSupabase
    .from("claim_subjects")
    .select("id, is_exempt, company_identified, call_category")
    .eq("claim_id", claim.id);

  if (subjectsError) {
    throw subjectsError;
  }

  const claimInput = {
    claim_strength: claim.claim_strength as ClaimStrengthGate | null,
  };

  const eligibleSubjectIds: string[] = [];

  for (const subject of subjects ?? []) {
    const referral = canReferToAttorney(claimInput, {
      is_exempt: subject.is_exempt,
      company_identified: subject.company_identified,
      call_category: subject.call_category,
    });
    if (referral.ok) {
      eligibleSubjectIds.push(subject.id);
    }
  }

  if (eligibleSubjectIds.length === 0) {
    throw new AttorneyReferralNotAllowedError(["claim_ineligible"]);
  }

  const { data: existingLead, error: existingError } = await admin
    .from("leads")
    .select("id, status, evidence_pdf_url")
    .eq("claim_id", claim.id)
    .in("status", [...ACTIVE_LEAD_STATUSES])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingLead?.id) {
    if (!existingLead.evidence_pdf_url?.trim()) {
      await runEvidencePdfJob(admin, {
        claimId: claim.id,
        leadId: existingLead.id,
      });
    }
    return { status: "already_submitted", leadId: existingLead.id };
  }

  const { data: profile, error: profileError } = await userSupabase
    .from("users")
    .select("state")
    .eq("id", input.userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const { data: inserted, error: insertError } = await admin
    .from("leads")
    .insert({
      claim_id: claim.id,
      user_id: input.userId,
      violation_type: claim.violation_type,
      status: "new",
      claim_strength: claim.claim_strength,
      estimated_value_low_cents: claim.estimated_value_low_cents,
      estimated_value_high_cents: claim.estimated_value_high_cents,
      estimated_value_realistic_cents: claim.estimated_value_realistic_cents,
      consumer_state: profile?.state ?? null,
    })
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    throw insertError ?? new Error("Lead insert failed");
  }

  const consentAt = new Date().toISOString();

  const { error: eventsError } = await admin.from("claim_events").insert([
    {
      claim_id: claim.id,
      event_type: ATTORNEY_REFERRAL_EVENT_TYPE,
      key: ATTORNEY_REFERRAL_EVENT_KEYS.leadId,
      value: inserted.id,
      source: "user_input",
    },
    {
      claim_id: claim.id,
      event_type: ATTORNEY_REFERRAL_EVENT_TYPE,
      key: ATTORNEY_REFERRAL_EVENT_KEYS.subjectIds,
      value: JSON.stringify(eligibleSubjectIds),
      source: "user_input",
    },
    {
      claim_id: claim.id,
      event_type: ATTORNEY_REFERRAL_EVENT_TYPE,
      key: ATTORNEY_REFERRAL_EVENT_KEYS.leadSharingConsent,
      value: consentAt,
      source: "user_input",
    },
  ]);

  if (eventsError) {
    throw eventsError;
  }

  await runEvidencePdfJob(admin, {
    claimId: claim.id,
    leadId: inserted.id,
  });

  await sendAttorneyReferralConfirmation(admin, {
    claimId: claim.id,
    userEmail: input.userEmail,
  });

  return { status: "created", leadId: inserted.id };
}
