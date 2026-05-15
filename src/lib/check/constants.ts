/**
 * Check funnel steps (`/check`). Step 0 is evidence preservation before number entry (PRD §10).
 *
 * @see prd.md section 10 — Evidence Preservation
 * @see task_manager.md §4.1.2
 */
export const CHECK_FLOW_STEPS = [
  {
    id: 0,
    /** Full label for page headings (includes “Step N —”). */
    heading: "Step 0 — Preserve evidence",
    /** Short label for the step indicator on narrow viewports. */
    indicatorLabel: "Preserve evidence",
  },
  {
    id: 1,
    heading: "Step 1 — Enter numbers",
    indicatorLabel: "Enter numbers",
  },
] as const;

export type CheckFlowStep = (typeof CHECK_FLOW_STEPS)[number];

export type CheckFlowStepId = CheckFlowStep["id"];

/** Active step for v0.1 `/check` until §4.3 number entry ships. */
export const CHECK_DEFAULT_ACTIVE_STEP_ID = 0 satisfies CheckFlowStepId;

/** Intro copy framing step zero (PRD §10). */
export const CHECK_STEP_ZERO_INTRO =
  "Before you enter phone numbers, take a moment to preserve what you already have. Stronger evidence usually means a stronger claim — we do not guarantee any outcome.";
