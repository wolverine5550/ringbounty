/**
 * CI-3.1.4 — Early exit when confidence threshold met or Path A seed skips paid rounds.
 */

import { computeAggregatedConfidence } from "./confidence";
import type { IntelSourceHit, SynthesisResult } from "./types";

export function shouldStopCompanyIntelligenceOrchestrator(input: {
  sources: IntelSourceHit[];
  synthesis: SynthesisResult | null;
  skipPaidRounds: boolean;
  shortCircuitThreshold: number;
}): boolean {
  if (input.skipPaidRounds) {
    return true;
  }

  if (
    input.synthesis !== null &&
    input.synthesis.confidence >= input.shortCircuitThreshold
  ) {
    return true;
  }

  const aggregated = computeAggregatedConfidence(input.sources);
  return aggregated >= input.shortCircuitThreshold;
}
