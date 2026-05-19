/**
 * CI-2.1.3 — Map aggregated FTC complaint count → `seed_violations.confidence_level`.
 * Aligns with `SOURCE_CONFIDENCE` tiers in company-intelligence/confidence.ts.
 */

/** Complaint-count buckets for Path B FTC seed (no legal entity name). */
export function confidenceLevelForFtcComplaintCount(
  count: number,
): "ftc_complaint_low" | "ftc_complaint_medium" | "ftc_complaint_high" {
  if (count >= 100) {
    return "ftc_complaint_high";
  }
  if (count >= 10) {
    return "ftc_complaint_medium";
  }
  return "ftc_complaint_low";
}
