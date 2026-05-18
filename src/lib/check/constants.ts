/**
 * Check funnel copy (`/check`) — number entry and submit (§4.3–4.6).
 *
 * Evidence preservation (PRD §10) runs on `/attorney-connect` before referral.
 */

/** Primary heading on `/check` (single-step funnel). */
export const CHECK_NUMBER_ENTRY_HEADING = "Enter a number";

/** Max rows on `/check` for signed-in users (task_manager §4.3.2 abuse guard). */
export const CHECK_MAX_PHONE_ROWS = 10;

/** Anonymous funnel: one phone number per session before sign-in (pre-launch 2026-05-18). */
export const CHECK_FREE_LOOKUP_MAX_PHONES = 1;

/** Shown on `/check` page header — replaces dashed outcome-panel copy. */
export const CHECK_FREE_LOOKUP_INTRO =
  "Your first number check is free without an account. Sign in to save your claim and continue with qualification questions.";

/**
 * After a successful `POST /api/check/submit` from the funnel, dispatch
 * `new Event(RB_CHECK_SUBMITTED_EVENT)` so `CheckOutcomePanel` can refetch gate status.
 */
export const RB_CHECK_SUBMITTED_EVENT = "rb-check-submitted";
