/**
 * Phase 7.1 — Qualification wizard routing (`/qualify/[claimSubjectId]`).
 *
 * Screens 1–4 map to PRD qualification steps (§7.2–7.5). Federal DNC attestation
 * (Phase 6.2) is a pre-wizard gate on the same route when `?step=` is absent.
 */

/** Wizard screens persisted via `?step=` and {@link QUALIFY_STEP_RESUME_EVENT_KEY}. */
export const QUALIFY_WIZARD_STEP_MIN = 1 as const;
export const QUALIFY_WIZARD_STEP_MAX = 4 as const;

export type QualifyWizardStep = 1 | 2 | 3 | 4;

/** `claim_events.key` for last completed wizard screen (resume). */
export const QUALIFY_STEP_RESUME_EVENT_KEY = "qualify_step_resume" as const;

/** Short headings for step chrome (full forms ship in §7.2–7.5). */
export const QUALIFY_STEP_TITLES: Record<QualifyWizardStep, string> = {
  1: "Consent and established business relationship",
  2: "Stop request and internal do-not-call",
  3: "Call details and timing",
  4: "Company identification and evidence",
};
