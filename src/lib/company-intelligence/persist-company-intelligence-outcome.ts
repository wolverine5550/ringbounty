/**
 * CI-3.2 — Suggest-only persistence + `claim_events` audit (v1 default).
 *
 * v1: patches `company_name_suggested` / `company_intel_*`; never sets `company_identified`
 * unless already true from Lane A / voicemail / Q13.
 * v2: optional auto-promote when `COMPANY_INTEL_AUTO_PROMOTE_ENABLED` + `shouldPromoteToIdentified`.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { persistRegisteredAgentLookup } from "@/lib/company/persist-registered-agent-lookup";
import { isSubstantiveCompanyName } from "@/lib/constants/company-identification";
import type { Database } from "@/types/database";

import type { CompanyIntelligenceEnv } from "./company-intelligence-flags";
import {
  COMPANY_IDENTIFICATION_SOURCE_KEY,
  COMPANY_INTEL_APIS_CALLED_KEY,
  COMPANY_INTEL_ESTIMATED_COST_CENTS_KEY,
  COMPANY_INTELLIGENCE_COMPLETED_KEY,
  COMPANY_INTELLIGENCE_EVENT_SOURCE,
  COMPANY_INTELLIGENCE_EVENT_TYPE,
  COMPANY_NAME_SUGGESTED_EVENT_KEY,
} from "./company-intelligence-events";
import { shouldPromoteToIdentified } from "./confidence";
import type { RunCompanyIntelligenceAgentResult } from "./run-company-intelligence-agent";
import { writeBackSeedViolationFromAgent } from "./sources/seed-violations";
import type { SynthesisResult } from "./types";

type IntelligenceRunRow =
  Database["public"]["Tables"]["company_intelligence_runs"]["Row"];

export type SubjectForIntelPersist = {
  claimId: string;
  companyIdentified: boolean;
  companyName: string | null;
  isExempt: boolean;
  anonymousSessionId: string | null;
  userStateCode: string | null;
};

/**
 * Loads subject + parent claim context for CI-3.2 persistence (events need `claim_id`).
 */
export async function loadSubjectForIntelPersist(
  admin: SupabaseClient<Database>,
  claimSubjectId: string,
): Promise<SubjectForIntelPersist> {
  const { data, error } = await admin
    .from("claim_subjects")
    .select(
      "claim_id, company_identified, company_name, is_exempt, claims(anonymous_session_id, user_id, users(state))",
    )
    .eq("id", claimSubjectId)
    .maybeSingle();

  if (error) {
    throw new Error(`claim_subjects load failed: ${error.message}`);
  }
  if (!data?.claim_id) {
    throw new Error(`claim_subjects not found: ${claimSubjectId}`);
  }

  const claimsRow = data.claims;
  let anonymousSessionId: string | null = null;
  let userStateCode: string | null = null;

  if (claimsRow && typeof claimsRow === "object") {
    if (
      "anonymous_session_id" in claimsRow &&
      typeof claimsRow.anonymous_session_id === "string"
    ) {
      anonymousSessionId = claimsRow.anonymous_session_id;
    }
    const usersRow =
      "users" in claimsRow && claimsRow.users && typeof claimsRow.users === "object"
        ? claimsRow.users
        : null;
    if (usersRow && "state" in usersRow && typeof usersRow.state === "string") {
      userStateCode = usersRow.state;
    }
  }

  return {
    claimId: data.claim_id,
    companyIdentified: data.company_identified,
    companyName: data.company_name,
    isExempt: data.is_exempt,
    anonymousSessionId,
    userStateCode,
  };
}

function buildCompanyIntelligenceClaimEventRows(
  claimId: string,
  synthesis: SynthesisResult | null,
  promoted: boolean,
  costEstimate: RunCompanyIntelligenceAgentResult["costEstimate"],
): Database["public"]["Tables"]["claim_events"]["Insert"][] {
  const source = COMPANY_INTELLIGENCE_EVENT_SOURCE;
  const rows: Database["public"]["Tables"]["claim_events"]["Insert"][] = [
    {
      claim_id: claimId,
      event_type: COMPANY_INTELLIGENCE_EVENT_TYPE,
      key: COMPANY_INTELLIGENCE_COMPLETED_KEY,
      value: "true",
      source,
    },
    {
      claim_id: claimId,
      event_type: COMPANY_INTELLIGENCE_EVENT_TYPE,
      key: COMPANY_IDENTIFICATION_SOURCE_KEY,
      value: COMPANY_INTELLIGENCE_EVENT_SOURCE,
      source,
    },
    {
      claim_id: claimId,
      event_type: COMPANY_INTELLIGENCE_EVENT_TYPE,
      key: COMPANY_INTEL_ESTIMATED_COST_CENTS_KEY,
      value: String(costEstimate.estimatedCostCents),
      source,
    },
    {
      claim_id: claimId,
      event_type: COMPANY_INTELLIGENCE_EVENT_TYPE,
      key: COMPANY_INTEL_APIS_CALLED_KEY,
      value: JSON.stringify(costEstimate.apisCalled),
      source,
    },
  ];

  const suggestedName = synthesis?.companyName?.trim() ?? "";
  if (isSubstantiveCompanyName(suggestedName)) {
    rows.push({
      claim_id: claimId,
      event_type: COMPANY_INTELLIGENCE_EVENT_TYPE,
      key: COMPANY_NAME_SUGGESTED_EVENT_KEY,
      value: suggestedName,
      source,
    });
  }

  if (promoted && isSubstantiveCompanyName(suggestedName)) {
    rows.push(
      {
        claim_id: claimId,
        event_type: COMPANY_INTELLIGENCE_EVENT_TYPE,
        key: "company_name",
        value: suggestedName,
        source,
      },
      {
        claim_id: claimId,
        event_type: COMPANY_INTELLIGENCE_EVENT_TYPE,
        key: "company_identified",
        value: "true",
        source,
      },
      {
        claim_id: claimId,
        event_type: COMPANY_INTELLIGENCE_EVENT_TYPE,
        key: "tcpa_letter_blocked",
        value: "",
        source,
      },
      {
        claim_id: claimId,
        event_type: COMPANY_INTELLIGENCE_EVENT_TYPE,
        key: "tcpa_letter_unblocked_reason",
        value: "company_intelligence_auto_promote",
        source,
      },
    );
  }

  return rows;
}

export type PersistCompanyIntelligenceOutcomeParams = {
  admin: SupabaseClient<Database>;
  run: IntelligenceRunRow;
  agentResult: RunCompanyIntelligenceAgentResult;
  env?: CompanyIntelligenceEnv;
};

export type PersistCompanyIntelligenceOutcomeResult = {
  /** v2 only — agent set `company_identified` on this run. */
  autoPromoted: boolean;
};

/**
 * CI-3.2.1–3.2.4 — Subject suggest fields, `claim_events`, seed write-back, optional v2 RA.
 */
export async function persistCompanyIntelligenceOutcome(
  params: PersistCompanyIntelligenceOutcomeParams,
): Promise<PersistCompanyIntelligenceOutcomeResult> {
  const { admin, run, agentResult, env } = params;
  const synthesis = agentResult.synthesis;
  const subject = await loadSubjectForIntelPersist(admin, run.claim_subject_id);

  const substantiveSuggested = isSubstantiveCompanyName(synthesis?.companyName);
  const autoPromote =
    !subject.companyIdentified &&
    substantiveSuggested &&
    shouldPromoteToIdentified(
      {
        sources: agentResult.allSources,
        aggregatedConfidence: synthesis?.confidence,
      },
      env,
    );

  const subjectPatch: Database["public"]["Tables"]["claim_subjects"]["Update"] = {
    company_intel_status: "completed",
  };

  if (synthesis) {
    subjectPatch.company_name_suggested = synthesis.companyName;
    subjectPatch.company_intel_confidence = synthesis.confidence;
    subjectPatch.company_intel_reasoning = synthesis.reasoning;
  }

  // CI-3.2.1 — v1 never overwrites Lane A / voicemail / Q13 identification.
  if (autoPromote && synthesis?.companyName) {
    subjectPatch.company_name = synthesis.companyName.trim();
    subjectPatch.company_identified = true;
  }

  const { error: subjectError } = await admin
    .from("claim_subjects")
    .update(subjectPatch)
    .eq("id", run.claim_subject_id);
  if (subjectError) {
    throw subjectError;
  }

  const eventRows = buildCompanyIntelligenceClaimEventRows(
    subject.claimId,
    synthesis,
    autoPromote,
    agentResult.costEstimate,
  );
  if (eventRows.length > 0) {
    const { error: eventsError } = await admin.from("claim_events").insert(eventRows);
    if (eventsError) {
      throw eventsError;
    }
  }

  if (substantiveSuggested && synthesis) {
    await writeBackSeedViolationFromAgent(admin, {
      phoneNumberNormalized: run.phone_number_normalized,
      companyName: synthesis.companyName!,
      confidence: synthesis.confidence,
      claimSubjectId: run.claim_subject_id,
      runId: run.id,
    });
  }

  // CI-3.2.4 — RA only after substantive `company_name` (v2 auto-promote path).
  if (
    autoPromote &&
    synthesis?.companyName &&
    !subject.isExempt &&
    subject.userStateCode
  ) {
    await persistRegisteredAgentLookup(admin, {
      claimId: subject.claimId,
      claimSubjectId: run.claim_subject_id,
      companyName: synthesis.companyName,
      userStateCode: subject.userStateCode,
      anonymousSessionId: subject.anonymousSessionId,
      lookup: { env },
    });
  }

  return { autoPromoted: autoPromote };
}
