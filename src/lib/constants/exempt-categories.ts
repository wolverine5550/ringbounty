/**
 * PRD §6 — TCPA-exempt call types detected from merged `call_category` (spam DB).
 *
 * **Not included:** established business relationship (EBR) — determined in qualification
 * (PRD §6 table), not from spam DB category alone.
 */

/** Canonical exempt slugs aligned with PRD §6 (spam DB + user confirmation where noted). */
export const EXEMPT_CATEGORIES = [
  "political",
  "charity",
  "survey",
  "healthcare",
  "debt_collection",
  "emergency",
] as const;

export type ExemptCategory = (typeof EXEMPT_CATEGORIES)[number];

/**
 * Neutral copy when a number is flagged exempt (PRD §6 “Handling exempt numbers”).
 * Shown on `/check` per-number results; excluded from claim estimate / violation path.
 */
export const EXEMPT_TCPA_USER_MESSAGE =
  "This type of call may be exempt from TCPA. We've excluded it from your claim estimate.";

/** Maps normalized provider slugs to a canonical {@link ExemptCategory}. */
const EXEMPT_CATEGORY_ALIASES: Record<string, ExemptCategory> = {
  political: "political",
  charity: "charity",
  charitable: "charity",
  survey: "survey",
  research: "survey",
  healthcare: "healthcare",
  health_care: "healthcare",
  debt_collection: "debt_collection",
  debt_collector: "debt_collection",
  debt: "debt_collection",
  emergency: "emergency",
};

/** Stable `claim_subjects.exempt_reason` tokens (not user-facing prose). */
const EXEMPT_REASON_BY_CATEGORY: Record<ExemptCategory, string> = {
  political: "tcpa_exempt_political",
  charity: "tcpa_exempt_charity",
  survey: "tcpa_exempt_survey",
  healthcare: "tcpa_exempt_healthcare",
  debt_collection: "tcpa_exempt_debt_collection",
  emergency: "tcpa_exempt_emergency",
};

/** Normalizes vendor labels (e.g. Nomorobo `Debt Collector`) to lowercase slug form. */
export function normalizeCallCategorySlug(
  category: string | null | undefined,
): string | null {
  if (typeof category !== "string" || category.trim() === "") {
    return null;
  }
  return category.trim().toLowerCase().replace(/\s+/g, "_");
}

/** Returns the canonical exempt category when `callCategory` matches PRD §6, else `null`. */
export function resolveExemptCategory(
  callCategory: string | null | undefined,
): ExemptCategory | null {
  const slug = normalizeCallCategorySlug(callCategory);
  if (slug === null) {
    return null;
  }
  if ((EXEMPT_CATEGORIES as readonly string[]).includes(slug)) {
    return slug as ExemptCategory;
  }
  return EXEMPT_CATEGORY_ALIASES[slug] ?? null;
}

export function isExemptCallCategory(
  callCategory: string | null | undefined,
): boolean {
  return resolveExemptCategory(callCategory) !== null;
}

/** Reason string for `claim_subjects.exempt_reason` when exempt. */
export function getExemptReasonForCategory(
  category: ExemptCategory,
): string {
  return EXEMPT_REASON_BY_CATEGORY[category];
}

export type ExemptResolution = {
  isExempt: boolean;
  exemptReason: string | null;
  exemptCategory: ExemptCategory | null;
};

/** Derives exempt flags from merged spam `call_category` (§5.5.2). */
export function resolveExemptFromCallCategory(
  callCategory: string | null,
): ExemptResolution {
  const exemptCategory = resolveExemptCategory(callCategory);
  if (exemptCategory === null) {
    return { isExempt: false, exemptReason: null, exemptCategory: null };
  }
  return {
    isExempt: true,
    exemptReason: getExemptReasonForCategory(exemptCategory),
    exemptCategory,
  };
}
