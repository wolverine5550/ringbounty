/**
 * Phase 7.5.1 — Persist Q13 user company identification + OpenCorporates soft verify.
 */

import type { ClaimEventSource } from "@/lib/constants/claimEvent";
import {
  COMPANY_NAME_VERIFICATION_STATUS_KEY,
  type CompanyNameVerificationStatus,
} from "@/lib/constants/company-name-verification";
import { TCPA_LETTER_BLOCKED_COMPANY_UNIDENTIFIED } from "@/lib/constants/company-identification";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  softVerifyCompanyNameWithOpenCorporates,
  type OpenCorporatesSoftVerifyOptions,
} from "./opencorporates-soft-verify";

const QUALIFICATION_EVENT = "qualification_answer" as const;
const USER_INPUT_SOURCE: ClaimEventSource = "user_input";

export type PersistUserCompanyIdentificationParams = {
  claimId: string;
  claimSubjectId: string;
  companyName: string;
  userStateCode?: string | null;
  openCorporates?: OpenCorporatesSoftVerifyOptions;
};

export type PersistUserCompanyIdentificationResult = {
  verificationStatus: CompanyNameVerificationStatus;
  showUnverifiedWarning: boolean;
};

/**
 * Saves Q13 company name, runs soft OpenCorporates verify, clears company letter block.
 * Letter purchase remains allowed for both verified and unverified (warning in UI).
 */
export async function persistUserCompanyIdentification(
  admin: SupabaseClient<Database>,
  params: PersistUserCompanyIdentificationParams,
): Promise<PersistUserCompanyIdentificationResult> {
  const companyName = params.companyName.trim();
  const verification = await softVerifyCompanyNameWithOpenCorporates(
    companyName,
    {
      userStateCode: params.userStateCode,
      ...params.openCorporates,
    },
  );

  const { error: updateError } = await admin
    .from("claim_subjects")
    .update({
      company_name: companyName,
      company_identified: true,
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
      source: USER_INPUT_SOURCE,
    },
    {
      claim_id: params.claimId,
      event_type: QUALIFICATION_EVENT,
      key: "company_identified",
      value: "true",
      source: USER_INPUT_SOURCE,
    },
    {
      claim_id: params.claimId,
      event_type: QUALIFICATION_EVENT,
      key: "company_identification_source",
      value: "user_input",
      source: USER_INPUT_SOURCE,
    },
    {
      claim_id: params.claimId,
      event_type: QUALIFICATION_EVENT,
      key: COMPANY_NAME_VERIFICATION_STATUS_KEY,
      value: verification.status,
      source: "opencorporates",
    },
    {
      claim_id: params.claimId,
      event_type: QUALIFICATION_EVENT,
      key: "tcpa_letter_blocked",
      value: "",
      source: USER_INPUT_SOURCE,
    },
    {
      claim_id: params.claimId,
      event_type: QUALIFICATION_EVENT,
      key: "tcpa_letter_unblocked_reason",
      value: "q13_user_company",
      source: USER_INPUT_SOURCE,
    },
  ];

  if (verification.skippedReason === "missing_token") {
    eventRows.push({
      claim_id: params.claimId,
      event_type: QUALIFICATION_EVENT,
      key: "opencorporates_soft_verify_skipped",
      value: "missing_token",
      source: "system",
    });
  }

  const { error: insertError } = await admin.from("claim_events").insert(eventRows);
  if (insertError) {
    throw insertError;
  }

  return {
    verificationStatus: verification.status,
    showUnverifiedWarning: verification.status === "user_input_unverified",
  };
}

/** For tests / letter gate — whether subject was blocked only for company_unidentified. */
export const COMPANY_UNIDENTIFIED_BLOCK_VALUE = TCPA_LETTER_BLOCKED_COMPANY_UNIDENTIFIED;
