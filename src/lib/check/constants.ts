/**
 * Check funnel copy (`/check`) — number entry and submit (§4.3–4.6).
 *
 * Evidence preservation (PRD §10) runs on `/attorney-connect` before referral.
 */

/** Primary heading on `/check` (single-step funnel). */
export const CHECK_NUMBER_ENTRY_HEADING = "Enter numbers";

/** Max rows on `/check` (task_manager §4.3.2 abuse guard). */
export const CHECK_MAX_PHONE_ROWS = 10;

/**
 * After a successful `POST /api/check/submit` from the funnel, dispatch
 * `new Event(RB_CHECK_SUBMITTED_EVENT)` so `CheckOutcomePanel` can refetch gate status.
 */
export const RB_CHECK_SUBMITTED_EVENT = "rb-check-submitted";
