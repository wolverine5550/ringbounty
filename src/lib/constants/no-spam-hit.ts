/**
 * PRD §7 / §9 — Non-exempt numbers with no spam-database hit (§5.6.1).
 *
 * Product: **soft warning** + user may still continue to qualification (graceful empty state).
 * Does not block the funnel or trigger the account wall by itself.
 */

/** Short status line under the phone number on `/check`. */
export const NO_SPAM_HIT_HEADLINE =
  "Not listed in the spam databases we checked";

/** Supporting copy — points users to the qualification step as the real signal. */
export const NO_SPAM_HIT_USER_MESSAGE =
  "That is common. Whether your number is on the Do Not Call Registry, whether you asked the caller to stop, and your call history matter more than this lookup alone.";

/** Primary CTA after a completed check when the user can enter qualify. */
export const CHECK_CONTINUE_TO_QUALIFY_LABEL = "Continue to questions";

/** Helper line under the continue CTA on `/check`. */
export const CHECK_CONTINUE_TO_QUALIFY_HELP =
  "Short questions about your number and the calls — usually 5–10 minutes. Informational only, not legal advice.";
