/**
 * Phase 7.5 — Screen 4 company identification + Q14 evidence flag.
 */

import {
  COMPANY_NAME_VERIFICATION_STATUS_KEY,
  isCompanyNameVerificationStatus,
  type CompanyNameVerificationStatus,
} from "@/lib/constants/company-name-verification";
import type { ClaimEventType } from "@/lib/constants/claimEvent";
import { persistUserCompanyIdentification } from "@/lib/company/persist-user-company-identification";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import { parseQualificationBooleanValue } from "./screen-1-consent";
import { persistQualifyResumeStep } from "./qualify-step";

const QUALIFICATION_ANSWER_EVENT: ClaimEventType = "qualification_answer";
const USER_INPUT_SOURCE = "user_input" as const;

/** `claim_events.key` values for Screen 4. */
export const QUALIFY_SCREEN_4_KEYS = {
  companyCallbackPhone: "company_callback_phone",
  companyProductPitch: "company_product_pitch",
  hasAdditionalEvidence: "has_additional_evidence",
  voicemailTranscript: "voicemail_transcript",
  companyIdentificationSource: "company_identification_source",
} as const;

const SCREEN_4_LOAD_KEYS = [
  QUALIFY_SCREEN_4_KEYS.companyCallbackPhone,
  QUALIFY_SCREEN_4_KEYS.companyProductPitch,
  QUALIFY_SCREEN_4_KEYS.hasAdditionalEvidence,
  QUALIFY_SCREEN_4_KEYS.voicemailTranscript,
  QUALIFY_SCREEN_4_KEYS.companyIdentificationSource,
  COMPANY_NAME_VERIFICATION_STATUS_KEY,
  "company_name",
] as const;

export type QualifyScreen4Answers = {
  companyName: string;
  companyCallbackPhone: string | null;
  companyProductPitch: string | null;
  hasAdditionalEvidence: boolean;
  voicemailTranscript: string | null;
  companyIdentificationSource: string | null;
  verificationStatus: CompanyNameVerificationStatus | null;
};

export type PersistQualifyScreen4Result = {
  showUnverifiedWarning: boolean;
  verificationStatus: CompanyNameVerificationStatus | null;
};

/** Validates Q13 company name (2–200 chars). */
export function parseQualifyCompanyName(
  value: unknown,
): string | { error: string } {
  if (typeof value !== "string") {
    return { error: "company_name must be a string" };
  }
  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return { error: "company_name must be at least 2 characters" };
  }
  if (trimmed.length > 200) {
    return { error: "company_name must be 200 characters or fewer" };
  }
  return trimmed;
}

function isFieldParseError(
  value: string | null | { error: string },
): value is { error: string } {
  return value !== null && typeof value === "object";
}

function parseOptionalContextField(
  value: unknown,
  fieldName: string,
  maxLen: number,
): string | null | { error: string } {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    return { error: `${fieldName} must be a string` };
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLen) {
    return { error: `${fieldName} must be ${maxLen} characters or fewer` };
  }
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Latest Screen 4-related answers for a claim.
 */
export async function loadQualifyScreen4Answers(
  supabase: SupabaseClient<Database>,
  claimId: string,
  subjectCompanyName: string | null,
): Promise<QualifyScreen4Answers | null> {
  const { data, error } = await supabase
    .from("claim_events")
    .select("key, value, created_at")
    .eq("claim_id", claimId)
    .eq("event_type", QUALIFICATION_ANSWER_EVENT)
    .in("key", [...SCREEN_4_LOAD_KEYS])
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const latest = new Map<string, string | null>();
  for (const row of data ?? []) {
    if (row.key && !latest.has(row.key)) {
      latest.set(row.key, row.value);
    }
  }

  const hasAdditionalEvidence = parseQualificationBooleanValue(
    latest.get(QUALIFY_SCREEN_4_KEYS.hasAdditionalEvidence),
  );

  if (hasAdditionalEvidence === null) {
    return null;
  }

  const eventCompanyName = latest.get("company_name")?.trim();
  const companyName =
    eventCompanyName && eventCompanyName.length > 0
      ? eventCompanyName
      : subjectCompanyName?.trim() ?? "";

  if (!companyName) {
    return null;
  }

  const verificationRaw = latest.get(COMPANY_NAME_VERIFICATION_STATUS_KEY);
  const verificationStatus = isCompanyNameVerificationStatus(verificationRaw)
    ? verificationRaw
    : null;

  return {
    companyName,
    companyCallbackPhone: latest.get(QUALIFY_SCREEN_4_KEYS.companyCallbackPhone) ?? null,
    companyProductPitch: latest.get(QUALIFY_SCREEN_4_KEYS.companyProductPitch) ?? null,
    hasAdditionalEvidence,
    voicemailTranscript: latest.get(QUALIFY_SCREEN_4_KEYS.voicemailTranscript) ?? null,
    companyIdentificationSource:
      latest.get(QUALIFY_SCREEN_4_KEYS.companyIdentificationSource) ?? null,
    verificationStatus,
  };
}

function qualificationEventRow(
  claimId: string,
  key: string,
  value: string,
): Database["public"]["Tables"]["claim_events"]["Insert"] {
  return {
    claim_id: claimId,
    event_type: QUALIFICATION_ANSWER_EVENT,
    key,
    value,
    source: USER_INPUT_SOURCE,
  };
}

/**
 * Persists Q13 (user_input path) or Q13 confirm + Q14; uses admin client for company persist.
 */
export async function persistQualifyScreen4Answers(
  admin: SupabaseClient<Database>,
  params: {
    claimId: string;
    claimSubjectId: string;
    userStateCode?: string | null;
    answers: QualifyScreen4Answers;
    /** When true, voicemail path already set `company_identified` — skip full user persist. */
    skipUserCompanyPersist?: boolean;
  },
): Promise<PersistQualifyScreen4Result> {
  const { claimId, claimSubjectId, answers } = params;

  let verificationStatus = answers.verificationStatus;
  let showUnverifiedWarning =
    verificationStatus === "user_input_unverified";

  if (!params.skipUserCompanyPersist) {
    const companyResult = await persistUserCompanyIdentification(admin, {
      claimId,
      claimSubjectId,
      companyName: answers.companyName,
      userStateCode: params.userStateCode,
    });
    verificationStatus = companyResult.verificationStatus;
    showUnverifiedWarning = companyResult.showUnverifiedWarning;
  } else {
    const { error: nameUpdateError } = await admin
      .from("claim_subjects")
      .update({ company_name: answers.companyName })
      .eq("id", claimSubjectId);

    if (nameUpdateError) {
      throw nameUpdateError;
    }

    await admin.from("claim_events").insert(
      qualificationEventRow(claimId, "company_name", answers.companyName),
    );
  }

  const contextRows: Database["public"]["Tables"]["claim_events"]["Insert"][] = [
    qualificationEventRow(
      claimId,
      QUALIFY_SCREEN_4_KEYS.hasAdditionalEvidence,
      String(answers.hasAdditionalEvidence),
    ),
  ];

  if (answers.companyCallbackPhone) {
    contextRows.push(
      qualificationEventRow(
        claimId,
        QUALIFY_SCREEN_4_KEYS.companyCallbackPhone,
        answers.companyCallbackPhone,
      ),
    );
  }

  if (answers.companyProductPitch) {
    contextRows.push(
      qualificationEventRow(
        claimId,
        QUALIFY_SCREEN_4_KEYS.companyProductPitch,
        answers.companyProductPitch,
      ),
    );
  }

  const { error: contextError } = await admin.from("claim_events").insert(contextRows);
  if (contextError) {
    throw contextError;
  }

  await persistQualifyResumeStep(admin, { claimId, step: 4 });

  return { showUnverifiedWarning, verificationStatus };
}

/** Validates API body for Screen 4 (§7.5.1–7.5.2). */
export function parseQualifyScreen4Body(
  body: Record<string, unknown>,
): QualifyScreen4Answers | { error: string } {
  const companyName = parseQualifyCompanyName(body.company_name);
  if (typeof companyName === "object") {
    return companyName;
  }

  const hasAdditionalEvidence = body.has_additional_evidence;
  if (hasAdditionalEvidence !== true && hasAdditionalEvidence !== false) {
    return { error: "has_additional_evidence must be true or false" };
  }

  const callbackParsed = parseOptionalContextField(
    body.company_callback_phone,
    "company_callback_phone",
    32,
  );
  if (isFieldParseError(callbackParsed)) {
    return callbackParsed;
  }

  const pitchParsed = parseOptionalContextField(
    body.company_product_pitch,
    "company_product_pitch",
    2000,
  );
  if (isFieldParseError(pitchParsed)) {
    return pitchParsed;
  }

  return {
    companyName,
    companyCallbackPhone: callbackParsed,
    companyProductPitch: pitchParsed,
    hasAdditionalEvidence,
    voicemailTranscript: null,
    companyIdentificationSource: null,
    verificationStatus: null,
  };
}
