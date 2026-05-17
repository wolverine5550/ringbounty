/**
 * Phase 13.2.1 — Human-readable qualification lines for the evidence PDF.
 */

import { QUALIFY_SCREEN_1_KEYS } from "@/lib/qualify/screen-1-consent";
import { QUALIFY_SCREEN_2_KEYS } from "@/lib/qualify/screen-2-stop-request";
import { QUALIFY_SCREEN_3_KEYS } from "@/lib/qualify/screen-3-call-details";
import { QUALIFY_SCREEN_4_KEYS } from "@/lib/qualify/screen-4-company-identification";
import {
  isLineType,
  LINE_TYPE_CLAIM_EVENT_KEY,
  lineTypeAttestationLabel,
} from "@/lib/tcpa/line-type-statute";

const BOOL_LABELS: Record<string, string> = {
  true: "Yes",
  false: "No",
};

function formatBool(value: string | undefined): string {
  if (value === undefined) {
    return "—";
  }
  return BOOL_LABELS[value] ?? value;
}

const KEY_LABELS: Record<string, string> = {
  [QUALIFY_SCREEN_1_KEYS.gaveDirectConsent]: "Gave direct consent to call",
  [QUALIFY_SCREEN_1_KEYS.thirdPartyConsentPossible]:
    "Third party may have had consent",
  [QUALIFY_SCREEN_1_KEYS.hasExistingRelationship]: "Existing business relationship",
  [QUALIFY_SCREEN_2_KEYS.stopRequestMade]: "Asked caller to stop",
  [QUALIFY_SCREEN_2_KEYS.stopRequestMethod]: "How stop was requested",
  [QUALIFY_SCREEN_2_KEYS.stopRequestDate]: "Date of stop request",
  [QUALIFY_SCREEN_2_KEYS.callsAfterStopRequest]: "Calls continued after stop request",
  [QUALIFY_SCREEN_3_KEYS.callCountTotal]: "Approximate total calls",
  [QUALIFY_SCREEN_3_KEYS.callCountAfterStop]: "Calls after stop request (count)",
  [QUALIFY_SCREEN_3_KEYS.mostRecentCallDate]: "Most recent call date",
  [QUALIFY_SCREEN_3_KEYS.callsBefore8am]: "Calls before 8 a.m.",
  [QUALIFY_SCREEN_3_KEYS.callsAfter9pm]: "Calls after 9 p.m.",
  [QUALIFY_SCREEN_3_KEYS.callsAfter9pmCount]: "Calls after 9 p.m. (count)",
  [QUALIFY_SCREEN_4_KEYS.hasAdditionalEvidence]:
    "User has additional evidence (screenshots, logs, etc.)",
  [QUALIFY_SCREEN_4_KEYS.companyCallbackPhone]: "Callback number from caller",
  [QUALIFY_SCREEN_4_KEYS.companyProductPitch]: "Product or pitch described",
  federal_dnc_registered: "Federal DNC registered (attestation)",
  federal_dnc_registration_date: "Federal DNC registration date",
  [LINE_TYPE_CLAIM_EVENT_KEY]: "Line type attestation",
};

const BOOL_KEYS = new Set([
  QUALIFY_SCREEN_1_KEYS.gaveDirectConsent,
  QUALIFY_SCREEN_1_KEYS.thirdPartyConsentPossible,
  QUALIFY_SCREEN_1_KEYS.hasExistingRelationship,
  QUALIFY_SCREEN_2_KEYS.stopRequestMade,
  QUALIFY_SCREEN_2_KEYS.callsAfterStopRequest,
  QUALIFY_SCREEN_3_KEYS.callsBefore8am,
  QUALIFY_SCREEN_3_KEYS.callsAfter9pm,
  QUALIFY_SCREEN_4_KEYS.hasAdditionalEvidence,
  "federal_dnc_registered",
]);

/**
 * Latest `qualification_answer` (and line type) keys → labeled lines for PDF.
 */
export function formatQualificationLines(
  latestByKey: Map<string, string>,
): { label: string; value: string }[] {
  const lines: { label: string; value: string }[] = [];

  for (const [key, label] of Object.entries(KEY_LABELS)) {
    const raw = latestByKey.get(key);
    if (raw === undefined) {
      continue;
    }

    let value = raw;
    if (BOOL_KEYS.has(key)) {
      value = formatBool(raw);
    } else if (key === LINE_TYPE_CLAIM_EVENT_KEY && isLineType(raw)) {
      value = lineTypeAttestationLabel(raw);
    }

    lines.push({ label, value });
  }

  const transcript = latestByKey.get(QUALIFY_SCREEN_4_KEYS.voicemailTranscript);
  if (transcript?.trim()) {
    lines.push({
      label: "Voicemail transcript (excerpt)",
      value:
        transcript.length > 500 ? `${transcript.slice(0, 500)}…` : transcript,
    });
  }

  return lines;
}
