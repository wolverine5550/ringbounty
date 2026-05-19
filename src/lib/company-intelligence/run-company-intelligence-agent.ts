/**
 * CI-3 orchestrator entry — stub until source rounds ship (**CI-3.1**).
 */

import type { CompanyIntelligenceEnv } from "./company-intelligence-flags";
import type { SynthesisResult } from "./types";

export type RunCompanyIntelligenceAgentParams = {
  phoneNumberNormalized: string;
  claimSubjectId: string;
  runId: string;
  env?: CompanyIntelligenceEnv;
};

export type RunCompanyIntelligenceAgentResult = {
  durationMs: number;
  synthesis: SynthesisResult | null;
};

/**
 * Lane B agent pipeline (FTC seed, SerpAPI, synthesis). **CI-1.2** worker calls this;
 * full implementation lands in **CI-3**.
 */
export async function runCompanyIntelligenceAgent(
  _params: RunCompanyIntelligenceAgentParams,
): Promise<RunCompanyIntelligenceAgentResult> {
  return {
    durationMs: 0,
    synthesis: null,
  };
}
