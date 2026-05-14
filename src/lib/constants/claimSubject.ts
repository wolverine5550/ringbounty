/**
 * Values for `claim_subjects.call_category` (see `prd.md` section 5, `claim_subjects` DDL comment).
 * Use these in forms and validation; the database column is plain `text` so ingestion stays flexible.
 *
 * Cross-check screening copy with `prd.md` section 6 (exempt call types: political, charity, survey,
 * healthcare, EBR, debt collection, emergency). Spam DB categories drive `call_category`; exempt
 * handling uses `is_exempt` / `exempt_reason` on the same row.
 */
export const CALL_CATEGORY_VALUES = [
  "telemarketer",
  "robocall",
  "scammer",
  "political",
  "charity",
  "healthcare",
  "survey",
  "unknown",
] as const;

export type CallCategory = (typeof CALL_CATEGORY_VALUES)[number];

/** Narrowing guard for API payloads and form state before writing to Supabase. */
export function isCallCategory(value: unknown): value is CallCategory {
  return (
    typeof value === "string" &&
    (CALL_CATEGORY_VALUES as readonly string[]).includes(value)
  );
}
