/**
 * CI-2.2 / CI-3 — Lane B agent entry (Round 1 seed local; paid rounds in CI-4).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import type { CompanyIntelligenceEnv } from "./company-intelligence-flags";
import {
  evaluateSeedViolationRound1,
  querySeedViolations,
} from "./sources/seed-violations";
import type { IntelSourceHit, SynthesisResult } from "./types";

export type RunCompanyIntelligenceAgentParams = {
  admin: SupabaseClient<Database>;
  phoneNumberNormalized: string;
  claimSubjectId: string;
  runId: string;
  env?: CompanyIntelligenceEnv;
};

export type RunCompanyIntelligenceAgentResult = {
  durationMs: number;
  synthesis: SynthesisResult | null;
  /** Round 1 hits for run audit (**CI-3**). */
  round1Hits: IntelSourceHit[];
  /** Path A seed short-circuit — skip SerpAPI/OpenRouter (**CI-4**). */
  skipPaidRounds: boolean;
};

/**
 * Lane B agent pipeline. **CI-2.2** implements Round 1 (`seed_violations`);
 * SerpAPI/synthesis rounds land in **CI-3** / **CI-4**.
 */
export async function runCompanyIntelligenceAgent(
  params: RunCompanyIntelligenceAgentParams,
): Promise<RunCompanyIntelligenceAgentResult> {
  const started = Date.now();
  const empty: RunCompanyIntelligenceAgentResult = {
    durationMs: 0,
    synthesis: null,
    round1Hits: [],
    skipPaidRounds: false,
  };

  const seed = await querySeedViolations(
    params.admin,
    params.phoneNumberNormalized,
  );
  if (!seed) {
    return { ...empty, durationMs: Date.now() - started };
  }

  const round1 = evaluateSeedViolationRound1(seed);

  // CI-2.2.3 write-back runs after substantive name from paid rounds (**CI-3** / **CI-4**),
  // not when Round 1 seed already holds the name (Path A).

  return {
    durationMs: Date.now() - started,
    synthesis: round1.synthesis,
    round1Hits: round1.hits,
    skipPaidRounds: round1.skipPaidRounds,
  };
}
