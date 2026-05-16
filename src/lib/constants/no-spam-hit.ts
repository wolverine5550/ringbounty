/**
 * PRD §7 / §9 — Non-exempt numbers with no spam-database hit (§5.6.1).
 *
 * Product: **soft warning** + user may still continue to qualification (graceful empty state).
 * Does not block the funnel or trigger the account wall by itself.
 */

/** Shown on `/check` when merged spam check found no known-spammer signal and the row is not exempt. */
export const NO_SPAM_HIT_USER_MESSAGE =
  "We didn't find this number in our spam databases. You can still continue with qualification — other factors (Do Not Call registration, stop requests, and call patterns) may still matter. A database match can strengthen a claim, but it isn't required to answer the next questions.";
