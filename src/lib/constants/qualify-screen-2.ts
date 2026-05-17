/**
 * Phase 7.3 — Screen 2 stop request / willful copy (prd.md §9 Screen 2).
 */

/** Q4 — did the user ask the company to stop calling. */
export const QUALIFY_Q4_PROMPT =
  "Did you ever ask this company to stop calling you?";

/** Q5 — how the stop request was made (shown when Q4 is Yes). */
export const QUALIFY_Q5_PROMPT = "How did you ask them to stop?";

/** Q6 — approximate date of the stop request (shown when Q4 is Yes). */
export const QUALIFY_Q6_PROMPT = "Approximately when did you ask them to stop?";

/** Q7 — calls continued after the stop request (shown when Q4 is Yes). */
export const QUALIFY_Q7_PROMPT =
  "Did they call you again after you asked them to stop?";

/**
 * PRD `internal_dnc_stop_request_method` / `claim_events.stop_request_method` values.
 * UI labels match prd.md §9 Q5 options.
 */
export const STOP_REQUEST_METHOD_OPTIONS = [
  { value: "text_stop", label: "Texted STOP" },
  { value: "text_stop_reply", label: "Replied STOP to a text" },
  { value: "verbal", label: "Told them verbally on a call" },
  { value: "email", label: "Sent an email" },
  { value: "written", label: "Sent a written letter" },
] as const;

export type StopRequestMethod =
  (typeof STOP_REQUEST_METHOD_OPTIONS)[number]["value"];

const STOP_REQUEST_METHOD_SET = new Set<string>(
  STOP_REQUEST_METHOD_OPTIONS.map((o) => o.value),
);

/** True when `value` is a supported stop-request method enum. */
export function isStopRequestMethod(value: string): value is StopRequestMethod {
  return STOP_REQUEST_METHOD_SET.has(value);
}
