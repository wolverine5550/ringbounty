/**
 * CI-8.2.2 — Maps agent confidence (0–100) to a user-facing tier for Screen 4 badges.
 *
 * Thresholds align with FTC complaint tiers in `SOURCE_CONFIDENCE` (high ≥ 85, medium ≥ 70).
 */

export type CompanyIntelConfidenceTier = "high" | "medium" | "low";

const HIGH_MIN = 85;
const MEDIUM_MIN = 70;

/** Resolves display tier from aggregated confidence; null when score is missing. */
export function resolveCompanyIntelConfidenceTier(
  confidence: number | null | undefined,
): CompanyIntelConfidenceTier | null {
  if (confidence === null || confidence === undefined || Number.isNaN(confidence)) {
    return null;
  }
  if (confidence >= HIGH_MIN) {
    return "high";
  }
  if (confidence >= MEDIUM_MIN) {
    return "medium";
  }
  return "low";
}

/** Badge label for qualify Screen 4 suggest UX. */
export function formatCompanyIntelConfidenceTierLabel(
  tier: CompanyIntelConfidenceTier,
): string {
  switch (tier) {
    case "high":
      return "High confidence match";
    case "medium":
      return "Medium confidence match";
    case "low":
      return "Low confidence match";
  }
}
