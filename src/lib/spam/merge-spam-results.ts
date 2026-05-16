/**
 * Phase 5.4 — Merge Nomorobo + Twilio {@link SpamCheckResult} rows per PRD §7 Step 1.
 *
 * Rules (see prd.md “Spam / reputation providers”):
 * - `isKnownSpammer` — OR of provider `isSpam`
 * - `confidenceScore` — max of non-null scores
 * - `complaintCount` — sum of non-null complaints (null only when both null)
 * - `callCategory` — Nomorobo `category` first, else Twilio
 * - `companyName` — Nomorobo first, else Twilio
 * - `spamDbSource` — which provider(s) contributed a spam hit (`nomorobo` | `twilio` | `both` | `none`)
 */

import { resolveExemptFromCallCategory } from "@/lib/constants/exempt-categories";

import type { SpamCheckResult } from "./types";

/** Allowed `claim_subjects.spam_db_source` values (prd.md `claim_subjects` DDL). */
export const SPAM_DB_SOURCE_VALUES = [
  "nomorobo",
  "twilio",
  "both",
  "none",
] as const;

export type SpamDbSource = (typeof SPAM_DB_SOURCE_VALUES)[number];

export type MergedSpamCheckOutcome = {
  isKnownSpammer: boolean;
  confidenceScore: number | null;
  complaintCount: number | null;
  callCategory: string | null;
  companyName: string | null;
  companyIdentified: boolean;
  spamDbSource: SpamDbSource;
  /** PRD §6 — merged category is a TCPA-exempt type (DNC / RA skipped downstream). */
  isExempt: boolean;
  exemptReason: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Adapters return `raw: { skipped: true, reason }` when disabled or credentials are missing. */
export function isSkippedSpamResult(result: SpamCheckResult): boolean {
  if (!isRecord(result.raw)) {
    return false;
  }
  return result.raw.skipped === true;
}

function maxNullableScores(scores: Array<number | null>): number | null {
  const finite = scores.filter(
    (s): s is number => s !== null && Number.isFinite(s),
  );
  if (finite.length === 0) {
    return null;
  }
  return Math.max(...finite);
}

function sumNullableComplaints(values: Array<number | null>): number | null {
  if (values.every((v) => v === null)) {
    return null;
  }
  let total = 0;
  for (const v of values) {
    total += v ?? 0;
  }
  return total;
}

function pickNomoroboFirst(
  nomorobo: SpamCheckResult | undefined,
  twilio: SpamCheckResult | undefined,
  field: "category" | "companyName",
): string | null {
  const key = field === "category" ? "category" : "companyName";
  const primary = nomorobo?.[key] ?? null;
  if (primary !== null && primary !== "") {
    return primary;
  }
  return twilio?.[key] ?? null;
}

/**
 * Which provider(s) materially flagged spam among **non-skipped** results.
 * When neither flags spam, returns `none` even if APIs returned scores/categories.
 */
export function resolveSpamDbSource(
  results: SpamCheckResult[],
): SpamDbSource {
  const active = results.filter((r) => !isSkippedSpamResult(r));
  const nomorobo = active.find((r) => r.providerId === "nomorobo");
  const twilio = active.find((r) => r.providerId === "twilio");
  const nomoSpam = nomorobo?.isSpam === true;
  const twilioSpam = twilio?.isSpam === true;
  if (nomoSpam && twilioSpam) {
    return "both";
  }
  if (nomoSpam) {
    return "nomorobo";
  }
  if (twilioSpam) {
    return "twilio";
  }
  return "none";
}

/**
 * Merges provider results in stable order: Nomorobo (primary) then Twilio (secondary).
 */
export function mergeSpamCheckResults(
  results: SpamCheckResult[],
): MergedSpamCheckOutcome {
  const nomorobo = results.find((r) => r.providerId === "nomorobo");
  const twilio = results.find((r) => r.providerId === "twilio");
  const active = results.filter((r) => !isSkippedSpamResult(r));

  const isKnownSpammer = active.some((r) => r.isSpam);
  const confidenceScore = maxNullableScores(active.map((r) => r.score));
  const complaintCount = sumNullableComplaints(
    active.map((r) => r.complaints),
  );
  const callCategory = pickNomoroboFirst(nomorobo, twilio, "category");
  const companyName = pickNomoroboFirst(nomorobo, twilio, "companyName");
  const companyIdentified =
    typeof companyName === "string" && companyName.trim() !== "";
  const exempt = resolveExemptFromCallCategory(callCategory);

  return {
    isKnownSpammer,
    confidenceScore,
    complaintCount,
    callCategory,
    companyName,
    companyIdentified,
    spamDbSource: resolveSpamDbSource(results),
    isExempt: exempt.isExempt,
    exemptReason: exempt.exemptReason,
  };
}
