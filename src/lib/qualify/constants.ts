/**
 * Phase 7.1 — Qualification wizard routing (`/qualify/[claimSubjectId]`).
 *
 * Screens 1–5 map to PRD qualification steps (§7.2–7.6). Federal DNC attestation
 * (Phase 6.2) is a pre-wizard gate on the same route when `?step=` is absent.
 */

/** Wizard screens persisted via `?step=` and {@link QUALIFY_STEP_RESUME_EVENT_KEY}. */
export const QUALIFY_WIZARD_STEP_MIN = 1 as const;
export const QUALIFY_WIZARD_STEP_MAX = 6 as const;

export type QualifyWizardStep = 1 | 2 | 3 | 4 | 5 | 6;

/** `claim_events.key` for last completed wizard screen (resume). */
export const QUALIFY_STEP_RESUME_EVENT_KEY = "qualify_step_resume" as const;

/** Shown under the qualify page title on every wizard screen. */
export const QUALIFY_EVALUATED_CALLER_LABEL = "Caller number you are qualifying:";

/**
 * Display string for the claim subject (screened caller), with E.164 fallback.
 */
export function formatQualifyEvaluatedCallerDisplay(
  phoneNumber: string | null | undefined,
  phoneNumberNormalized: string | null | undefined,
): string | null {
  const display = phoneNumber?.trim();
  if (display) {
    return display;
  }
  const normalized = phoneNumberNormalized?.trim();
  return normalized ?? null;
}

/** Short headings for step chrome (full forms ship in §7.2–7.6). */
export const QUALIFY_STEP_TITLES: Record<QualifyWizardStep, string> = {
  1: "Before we ask about the caller",
  2: "Stop request and internal do-not-call",
  3: "Call details and timing",
  4: "Company identification and evidence",
  5: "Permission and prior relationship",
  6: "Phone line type",
};
