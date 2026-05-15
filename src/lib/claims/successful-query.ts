/**
 * ## Successful query (Phase 2.2 — provisional)
 *
 * Product intent (`task_manager.md` “Product decisions”): users may run checks without an
 * account until the **first successful query** (they may have a claim); then an account is
 * required to see more. If the query yields **no claim / no results**, they may try another
 * number without signing up.
 *
 * **Open question** (same file, Open questions): the exact predicate is still subject to
 * stakeholder sign-off. This module encodes an explicit, **tested** interim rule using
 * **only persisted fields** from `claims` and `claim_subjects` — no client-only hints.
 *
 * ### Interim definition (v0)
 *
 * - **Not successful** if aggregate strength is `ineligible`.
 * - **Successful** if aggregate `claim_strength` is `strong`, `moderate`, or `weak`.
 * - Otherwise (strength `null` or unknown): **successful** if any subject row indicates a
 *   non-exempt spam-like call category (`telemarketer`, `robocall`, `scammer`) **or**
 *   `spam_db_complaint_count > 0` while `is_exempt` is false.
 *
 * When stakeholders finalize the predicate, update this block and adjust tests together.
 */

/** Call categories treated as a spam-DB style hit for the interim gate (subset of PRD list). */
export const SPAM_LIKE_CALL_CATEGORIES = [
  "telemarketer",
  "robocall",
  "scammer",
] as const;

export type SpamLikeCallCategory = (typeof SPAM_LIKE_CALL_CATEGORIES)[number];

export type ClaimStrengthGate = "strong" | "moderate" | "weak" | "ineligible" | null;

/** Minimal persisted slice for gating; keep in sync with DB columns only. */
export type ClaimQuerySnapshot = {
  claim: {
    claim_strength: ClaimStrengthGate;
  };
  subjects: Array<{
    is_exempt: boolean;
    call_category: string | null;
    spam_db_complaint_count: number | null;
  }>;
};

const POSITIVE_STRENGTHS = new Set<string>(["strong", "moderate", "weak"]);

function isSpamLikeCategory(value: string | null): value is SpamLikeCallCategory {
  if (value === null) return false;
  return (SPAM_LIKE_CALL_CATEGORIES as readonly string[]).includes(value);
}

function subjectIndicatesPotentialClaim(
  row: ClaimQuerySnapshot["subjects"][number],
): boolean {
  if (row.is_exempt) return false;
  if (isSpamLikeCategory(row.call_category)) return true;
  const count = row.spam_db_complaint_count;
  return count !== null && count > 0;
}

/**
 * Whether this persisted check outcome should trigger the “successful query” account wall
 * for anonymous users (see module docstring).
 */
export function isSuccessfulQuery(snapshot: ClaimQuerySnapshot): boolean {
  const strength = snapshot.claim.claim_strength;

  if (strength === "ineligible") {
    return false;
  }

  if (strength !== null && POSITIVE_STRENGTHS.has(strength)) {
    return true;
  }

  return snapshot.subjects.some(subjectIndicatesPotentialClaim);
}
