/**
 * Phase 7.5.4 — Persist voicemail transcription company ID + optional soft verify.
 */

import type { ClaimEventSource } from "@/lib/constants/claimEvent";
import {
  COMPANY_NAME_VERIFICATION_STATUS_KEY,
  type CompanyNameVerificationStatus,
} from "@/lib/constants/company-name-verification";
import { TCPA_LETTER_BLOCKED_COMPANY_UNIDENTIFIED } from "@/lib/constants/company-identification";
import type { Database, Json } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  softVerifyCompanyNameWithOpenCorporates,
  type OpenCorporatesSoftVerifyOptions,
} from "./opencorporates-soft-verify";
import { persistRegisteredAgentLookup } from "./persist-registered-agent-lookup";
import { VOICEMAIL_AUDIO_METADATA_KEY } from "./voicemail-evidence";

const QUALIFICATION_EVENT = "qualification_answer" as const;
const VOICEMAIL_SOURCE: ClaimEventSource = "voicemail_transcription";

export type PersistVoicemailCompanyIdentificationParams = {
  claimId: string;
  claimSubjectId: string;
  companyName: string;
  transcript: string;
  voicemailStoragePath: string;
  callbackPhone?: string | null;
  productPitch?: string | null;
  userStateCode?: string | null;
  anonymousSessionId?: string | null;
  openCorporates?: OpenCorporatesSoftVerifyOptions;
};

export type PersistVoicemailCompanyIdentificationResult = {
  verificationStatus: CompanyNameVerificationStatus | null;
  showUnverifiedWarning: boolean;
  registeredAgentFound: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Saves voicemail-derived company, transcript, clears company referral block.
 */
export async function persistVoicemailCompanyIdentification(
  admin: SupabaseClient<Database>,
  params: PersistVoicemailCompanyIdentificationParams,
): Promise<PersistVoicemailCompanyIdentificationResult> {
  const companyName = params.companyName.trim();

  const verification = await softVerifyCompanyNameWithOpenCorporates(companyName, {
    userStateCode: params.userStateCode,
    ...params.openCorporates,
  });

  const { data: subjectRow, error: metaLoadError } = await admin
    .from("claim_subjects")
    .select("metadata")
    .eq("id", params.claimSubjectId)
    .maybeSingle();

  if (metaLoadError) {
    throw metaLoadError;
  }

  const priorMeta = isRecord(subjectRow?.metadata) ? subjectRow.metadata : {};
  const metadata: Json = {
    ...priorMeta,
    [VOICEMAIL_AUDIO_METADATA_KEY]: params.voicemailStoragePath,
  };

  const { error: updateError } = await admin
    .from("claim_subjects")
    .update({
      company_name: companyName,
      company_identified: true,
      metadata,
    })
    .eq("id", params.claimSubjectId);

  if (updateError) {
    throw updateError;
  }

  const eventRows: Database["public"]["Tables"]["claim_events"]["Insert"][] = [
    {
      claim_id: params.claimId,
      event_type: QUALIFICATION_EVENT,
      key: "company_name",
      value: companyName,
      source: VOICEMAIL_SOURCE,
    },
    {
      claim_id: params.claimId,
      event_type: QUALIFICATION_EVENT,
      key: "company_identified",
      value: "true",
      source: VOICEMAIL_SOURCE,
    },
    {
      claim_id: params.claimId,
      event_type: QUALIFICATION_EVENT,
      key: "company_identification_source",
      value: "voicemail_transcription",
      source: VOICEMAIL_SOURCE,
    },
    {
      claim_id: params.claimId,
      event_type: QUALIFICATION_EVENT,
      key: "voicemail_transcript",
      value: params.transcript.slice(0, 8000),
      source: VOICEMAIL_SOURCE,
    },
    {
      claim_id: params.claimId,
      event_type: QUALIFICATION_EVENT,
      key: "voicemail_audio_path",
      value: params.voicemailStoragePath,
      source: VOICEMAIL_SOURCE,
    },
    {
      claim_id: params.claimId,
      event_type: QUALIFICATION_EVENT,
      key: "tcpa_letter_blocked",
      value: "",
      source: VOICEMAIL_SOURCE,
    },
    {
      claim_id: params.claimId,
      event_type: QUALIFICATION_EVENT,
      key: "tcpa_letter_unblocked_reason",
      value: "voicemail_company",
      source: VOICEMAIL_SOURCE,
    },
  ];

  if (verification.status) {
    eventRows.push({
      claim_id: params.claimId,
      event_type: QUALIFICATION_EVENT,
      key: COMPANY_NAME_VERIFICATION_STATUS_KEY,
      value: verification.status,
      source: "opencorporates",
    });
  }

  if (params.callbackPhone) {
    eventRows.push({
      claim_id: params.claimId,
      event_type: QUALIFICATION_EVENT,
      key: "company_callback_phone",
      value: params.callbackPhone,
      source: VOICEMAIL_SOURCE,
    });
  }

  if (params.productPitch) {
    eventRows.push({
      claim_id: params.claimId,
      event_type: QUALIFICATION_EVENT,
      key: "company_product_pitch",
      value: params.productPitch.slice(0, 2000),
      source: VOICEMAIL_SOURCE,
    });
  }

  const { error: insertError } = await admin.from("claim_events").insert(eventRows);
  if (insertError) {
    throw insertError;
  }

  const ra = await persistRegisteredAgentLookup(admin, {
    claimId: params.claimId,
    claimSubjectId: params.claimSubjectId,
    companyName,
    userStateCode: params.userStateCode,
    anonymousSessionId: params.anonymousSessionId,
    lookup: params.openCorporates,
  });

  return {
    verificationStatus: verification.status,
    showUnverifiedWarning: verification.status === "user_input_unverified",
    registeredAgentFound: ra.found,
  };
}

/** For tests — company block value constant. */
export const VOICEMAIL_COMPANY_BLOCK_CLEARED = TCPA_LETTER_BLOCKED_COMPANY_UNIDENTIFIED;
