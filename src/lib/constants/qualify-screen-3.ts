/**
 * Phase 7.4 — Screen 3 call details copy (prd.md §5 claim_events example rows).
 */

/** Q8 — approximate total calls from this number. */
export const QUALIFY_Q8_PROMPT =
  "About how many times has this number called you?";

/** Q9 — calls after stop request (shown when Screen 2 Q4 is Yes). */
export const QUALIFY_Q9_PROMPT =
  "About how many times did they call you after you asked them to stop?";

/** Q10 — most recent call; used for SOL and federal DNC 31-day rule. */
export const QUALIFY_Q10_PROMPT =
  "When was the most recent call from this number?";

/** Q11 — calls before 8:00 a.m. local time. */
export const QUALIFY_Q11_PROMPT =
  "Did any of these calls come before 8:00 a.m. (your local time)?";

/** Q12 — calls after 9:00 p.m. local time. */
export const QUALIFY_Q12_PROMPT =
  "Did any of these calls come after 9:00 p.m. (your local time)?";

/** Shown when Q12 is Yes — count for valuation / evidence. */
export const QUALIFY_Q12_COUNT_PROMPT =
  "About how many calls were after 9:00 p.m.?";

/**
 * Q8 bucket values stored in `claim_events.call_count_total` (lower bound per range).
 * PRD §8: pattern scoring uses 5+ calls; buckets keep UX simple without a slider control.
 */
export const CALL_COUNT_TOTAL_BUCKETS = [
  { value: 1, label: "1 call" },
  { value: 2, label: "2–4 calls" },
  { value: 5, label: "5–9 calls" },
  { value: 10, label: "10–19 calls" },
  { value: 20, label: "20 or more calls" },
] as const;

export type CallCountTotalBucket =
  (typeof CALL_COUNT_TOTAL_BUCKETS)[number]["value"];

const CALL_COUNT_TOTAL_SET = new Set<number>(
  CALL_COUNT_TOTAL_BUCKETS.map((b) => b.value),
);

/** True when `value` is a supported total-call bucket integer. */
export function isCallCountTotalBucket(
  value: number,
): value is CallCountTotalBucket {
  return CALL_COUNT_TOTAL_SET.has(value);
}
