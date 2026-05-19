/**
 * CI-3.1 — Deterministic synthesis from accumulated `IntelSourceHit[]` (pre–CI-4 OpenRouter).
 */

import { computeAggregatedConfidence, confidenceForSource } from "./confidence";
import type { IntelSourceHit, SynthesisResult } from "./types";
import { isSubstantiveCompanyName } from "@/lib/constants/company-identification";

/**
 * Builds suggest-only synthesis from orchestrator hits when no round returned explicit synthesis.
 */
export function buildSynthesisFromSourceHits(
  hits: IntelSourceHit[],
): SynthesisResult | null {
  if (hits.length === 0) {
    return null;
  }

  const substantive = hits.filter((h) => isSubstantiveCompanyName(h.companyName));
  const pool = substantive.length > 0 ? substantive : hits;

  let best: IntelSourceHit = pool[0]!;
  let bestScore = confidenceForSource(best);
  for (const hit of pool.slice(1)) {
    const score = confidenceForSource(hit);
    if (score > bestScore) {
      best = hit;
      bestScore = score;
    }
  }

  const aggregated = computeAggregatedConfidence(hits);
  const companyName = isSubstantiveCompanyName(best.companyName)
    ? best.companyName!.trim()
    : null;

  const tierLabels = [...new Set(hits.map((h) => h.tier))].join(", ");
  const reasoning =
    companyName !== null
      ? `Aggregated company intelligence from sources (${tierLabels}). Suggest-only until user confirms on qualify (CI-P.4).`
      : `Signals from ${tierLabels} did not yield a substantive legal entity name. Confirm the company on qualify step 4.`;

  return {
    companyName,
    confidence: aggregated,
    reasoning,
    callbackNumbers: [],
    isSpoofedPool: false,
  };
}
