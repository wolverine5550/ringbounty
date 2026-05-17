/**
 * Phase 13.2.1 — Load claim, subjects, events, and uploads for evidence PDF.
 */

import { getFederalDncScreenshotPathFromMetadata } from "@/lib/dnc/federal-dnc-evidence";
import { getVoicemailAudioPathFromMetadata } from "@/lib/company/voicemail-evidence";
import {
  ATTORNEY_REFERRAL_EVENT_KEYS,
  ATTORNEY_REFERRAL_EVENT_TYPE,
} from "@/lib/leads/attorney-referral-claim-events";
import { getResultsStrengthDisplay } from "@/lib/constants/results-strength";
import type { ClaimStrengthGate } from "@/lib/claims/successful-query";
import {
  buildDncSummary,
  buildSpamSummary,
} from "@/lib/scoring/subject-evidence-summaries";
import type { DncRowForStrength } from "@/lib/scoring/build-strength-matrix-input";
import { formatUsdFromCents } from "@/lib/scoring/compute-valuation";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import { formatQualificationLines } from "./format-qualification-lines";

export type EvidencePdfSubjectSection = {
  subjectId: string;
  phoneNumber: string | null;
  companyName: string | null;
  companyIdentified: boolean;
  callCategory: string | null;
  registeredAgentName: string | null;
  registeredAgentAddress: string | null;
  registeredAgentLookupSource: string | null;
  spamSummary: string;
  dncSummary: string;
  federalDncScreenshotPath: string | null;
  voicemailAudioPath: string | null;
};

export type EvidencePdfContext = {
  leadId: string;
  claimId: string;
  generatedAtIso: string;
  consumer: {
    fullName: string | null;
    email: string;
    state: string | null;
  };
  claim: {
    violationType: string;
    claimStrength: ClaimStrengthGate | null;
    strengthHeadline: string;
    valuationLow: string | null;
    valuationRealistic: string | null;
    valuationHigh: string | null;
  };
  subjects: EvidencePdfSubjectSection[];
  qualificationLines: { label: string; value: string }[];
};

function latestValuesByKey(
  rows: { key: string | null; value: string | null; created_at: string }[],
): Map<string, string> {
  const sorted = [...rows].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  const map = new Map<string, string>();
  for (const row of sorted) {
    if (row.key && row.value !== null) {
      map.set(row.key, row.value);
    }
  }
  return map;
}

function parseEligibleSubjectIds(value: string | null | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

/**
 * Loads all data required to compile the firm evidence PDF.
 */
export async function loadEvidencePdfContext(
  admin: SupabaseClient<Database>,
  params: { leadId: string },
): Promise<EvidencePdfContext | null> {
  const { data: lead, error: leadError } = await admin
    .from("leads")
    .select(
      "id, claim_id, user_id, violation_type, claim_strength, estimated_value_low_cents, estimated_value_high_cents, estimated_value_realistic_cents",
    )
    .eq("id", params.leadId)
    .maybeSingle();

  if (leadError) {
    throw leadError;
  }

  if (!lead?.id || !lead.claim_id) {
    return null;
  }

  const [{ data: claim, error: claimError }, { data: user, error: userError }] =
    await Promise.all([
      admin
        .from("claims")
        .select("id, claim_strength")
        .eq("id", lead.claim_id)
        .maybeSingle(),
      admin
        .from("users")
        .select("full_name, email, state")
        .eq("id", lead.user_id)
        .maybeSingle(),
    ]);

  if (claimError) {
    throw claimError;
  }
  if (userError) {
    throw userError;
  }
  if (!claim?.id || !user?.email) {
    return null;
  }

  const { data: referralEvents, error: referralError } = await admin
    .from("claim_events")
    .select("key, value, created_at")
    .eq("claim_id", lead.claim_id)
    .eq("event_type", ATTORNEY_REFERRAL_EVENT_TYPE)
    .eq("key", ATTORNEY_REFERRAL_EVENT_KEYS.subjectIds)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (referralError) {
    throw referralError;
  }

  const eligibleSubjectIds = parseEligibleSubjectIds(referralEvents?.value);

  const { data: subjects, error: subjectsError } = await admin
    .from("claim_subjects")
    .select(
      "id, phone_number, company_name, company_identified, call_category, metadata, is_exempt, spam_db_confidence_score, spam_db_complaint_count, spam_db_source, registered_agent_name, registered_agent_address, registered_agent_lookup_source",
    )
    .eq("claim_id", lead.claim_id);

  if (subjectsError) {
    throw subjectsError;
  }

  const subjectFilter =
    eligibleSubjectIds.length > 0
      ? (subjects ?? []).filter((s) => eligibleSubjectIds.includes(s.id))
      : (subjects ?? []);

  const subjectIds = subjectFilter.map((s) => s.id);

  const { data: dncRows, error: dncError } =
    subjectIds.length > 0
      ? await admin
          .from("dnc_check_results")
          .select(
            "claim_subject_id, federal_dnc_registered, federal_dnc_eligible, state_dnc_applicable, state_dnc_registered",
          )
          .in("claim_subject_id", subjectIds)
      : { data: [], error: null };

  if (dncError) {
    throw dncError;
  }

  const dncBySubject = new Map<string, DncRowForStrength>();
  for (const row of dncRows ?? []) {
    if (row.claim_subject_id) {
      dncBySubject.set(row.claim_subject_id, row);
    }
  }

  const { data: qualEvents, error: qualError } = await admin
    .from("claim_events")
    .select("key, value, created_at, event_type")
    .eq("claim_id", lead.claim_id)
    .in("event_type", ["qualification_answer", "dnc_check", "value_calculated"]);

  if (qualError) {
    throw qualError;
  }

  const qualRows = (qualEvents ?? []).filter(
    (e) => e.event_type === "qualification_answer" && e.key,
  ) as { key: string; value: string | null; created_at: string }[];

  const dncAttestationRows = (qualEvents ?? []).filter(
    (e) => e.event_type === "dnc_check" && e.key?.startsWith("federal_dnc"),
  ) as { key: string; value: string | null; created_at: string }[];

  const latestQual = latestValuesByKey([...qualRows, ...dncAttestationRows]);

  const strength =
    (lead.claim_strength ?? claim.claim_strength) as ClaimStrengthGate | null;
  const strengthDisplay = strength
    ? getResultsStrengthDisplay(strength as Parameters<typeof getResultsStrengthDisplay>[0])
    : { headline: "Not scored" };

  const subjectSections: EvidencePdfSubjectSection[] = subjectFilter.map((s) => ({
    subjectId: s.id,
    phoneNumber: s.phone_number,
    companyName: s.company_name,
    companyIdentified: s.company_identified,
    callCategory: s.call_category,
    registeredAgentName: s.registered_agent_name,
    registeredAgentAddress: s.registered_agent_address,
    registeredAgentLookupSource: s.registered_agent_lookup_source,
    spamSummary: buildSpamSummary(s),
    dncSummary: buildDncSummary(dncBySubject.get(s.id) ?? null),
    federalDncScreenshotPath: getFederalDncScreenshotPathFromMetadata(s.metadata),
    voicemailAudioPath: getVoicemailAudioPathFromMetadata(s.metadata),
  }));

  return {
    leadId: lead.id,
    claimId: lead.claim_id,
    generatedAtIso: new Date().toISOString(),
    consumer: {
      fullName: user.full_name,
      email: user.email,
      state: user.state,
    },
    claim: {
      violationType: lead.violation_type,
      claimStrength: strength,
      strengthHeadline: strengthDisplay.headline,
      valuationLow:
        lead.estimated_value_low_cents !== null
          ? formatUsdFromCents(lead.estimated_value_low_cents)
          : null,
      valuationRealistic:
        lead.estimated_value_realistic_cents !== null
          ? formatUsdFromCents(lead.estimated_value_realistic_cents)
          : null,
      valuationHigh:
        lead.estimated_value_high_cents !== null
          ? formatUsdFromCents(lead.estimated_value_high_cents)
          : null,
    },
    subjects: subjectSections,
    qualificationLines: formatQualificationLines(latestQual),
  };
}
