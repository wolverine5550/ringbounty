/**
 * CI-3.1 — Lane B agent orchestrator (multi-round; paid rounds stubbed until CI-4).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import type { CompanyIntelligenceEnv } from "./company-intelligence-flags";
import { loadClaimSubjectIntelContext } from "./load-claim-subject-intel-context";
import {
  getCompanyIntelShortCircuitThreshold,
} from "./orchestrator-policy";
import { shouldStopCompanyIntelligenceOrchestrator } from "./orchestrator-short-circuit";
import { shouldRunPaidIntelRounds } from "./paid-intel-rounds";
import { buildSynthesisFromSourceHits } from "./synthesize-from-sources";
import { evaluateLaneASpamProvidersRound2 } from "./sources/lane-a-spam-providers";
import {
  evaluateSeedViolationRound1,
  querySeedViolations,
} from "./sources/seed-violations";
import type {
  AgentRoundResult,
  IntelSourceHit,
  SynthesisResult,
} from "./types";

export type CompanyIntelligenceRoundAudit = {
  round: number;
  sourceTiers: string[];
  stoppedEarly: boolean;
  skippedReason?: string | null;
};

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
  /** All hits across rounds (CI-3.1.1 `sources[]`). */
  allSources: IntelSourceHit[];
  rounds: AgentRoundResult[];
  /** Persisted to `company_intelligence_runs.sources_queried` (CI-3.1.5). */
  roundAudits: CompanyIntelligenceRoundAudit[];
  /** Persisted to `company_intelligence_runs.raw_results` (CI-3.1.5). */
  rawResults: Record<string, unknown>;
  /** Path A seed short-circuit — skip SerpAPI/OpenRouter (**CI-4**). */
  skipPaidRounds: boolean;
  stoppedEarly: boolean;
  shortCircuitThreshold: number;
};

function mergeSynthesis(
  current: SynthesisResult | null,
  next: SynthesisResult | null,
): SynthesisResult | null {
  if (!next) {
    return current;
  }
  if (!current) {
    return next;
  }
  if (next.confidence >= current.confidence) {
    return next;
  }
  return current;
}

function buildRound2Synthesis(hits: IntelSourceHit[]): SynthesisResult | null {
  const built = buildSynthesisFromSourceHits(hits);
  if (!built) {
    return null;
  }
  const nomorobo = hits.find((h) => h.tier === "nomorobo");
  if (nomorobo?.companyName) {
    return {
      ...built,
      companyName: nomorobo.companyName,
      reasoning: `Reused Nomorobo check from submit: reported name "${nomorobo.companyName}". Suggest-only until user confirms on qualify (CI-P.4).`,
    };
  }
  return built;
}

/**
 * Lane B agent pipeline: Round 1 seed → Round 2 Lane A metadata → CI-4 paid rounds (later).
 */
export async function runCompanyIntelligenceAgent(
  params: RunCompanyIntelligenceAgentParams,
): Promise<RunCompanyIntelligenceAgentResult> {
  const started = Date.now();
  const shortCircuitThreshold = getCompanyIntelShortCircuitThreshold(params.env);

  const empty: RunCompanyIntelligenceAgentResult = {
    durationMs: 0,
    synthesis: null,
    allSources: [],
    rounds: [],
    roundAudits: [],
    rawResults: {},
    skipPaidRounds: false,
    stoppedEarly: false,
    shortCircuitThreshold,
  };

  const allSources: IntelSourceHit[] = [];
  const rounds: AgentRoundResult[] = [];
  const roundAudits: CompanyIntelligenceRoundAudit[] = [];
  const rawResults: Record<string, unknown> = {};
  let synthesis: SynthesisResult | null = null;
  let skipPaidRounds = false;

  const subjectContext = await loadClaimSubjectIntelContext(
    params.admin,
    params.claimSubjectId,
  );

  // --- Round 1: local seed / FTC (CI-2.2 / CI-3.1.2) ---
  const seed = await querySeedViolations(
    params.admin,
    params.phoneNumberNormalized,
  );
  if (seed) {
    const round1 = evaluateSeedViolationRound1(seed);
    allSources.push(...round1.hits);
    synthesis = mergeSynthesis(synthesis, round1.synthesis);
    skipPaidRounds = round1.skipPaidRounds;
    rawResults.round_1 = {
      seed: {
        source: seed.source,
        confidence_level: seed.confidenceLevel,
        violation_count: seed.violationCount,
        reported_company_name: seed.reportedCompanyName,
        metadata: seed.metadata,
      },
    };
    rounds.push({
      round: 1,
      hits: round1.hits,
      stoppedEarly: round1.stoppedEarly,
    });
    roundAudits.push({
      round: 1,
      sourceTiers: round1.hits.map((h) => h.tier),
      stoppedEarly: round1.stoppedEarly,
    });
  } else {
    roundAudits.push({
      round: 1,
      sourceTiers: [],
      stoppedEarly: false,
      skippedReason: "seed_miss",
    });
  }

  if (
    shouldStopCompanyIntelligenceOrchestrator({
      sources: allSources,
      synthesis,
      skipPaidRounds,
      shortCircuitThreshold,
    })
  ) {
    return {
      ...empty,
      durationMs: Date.now() - started,
      synthesis,
      allSources,
      rounds,
      roundAudits,
      rawResults,
      skipPaidRounds,
      stoppedEarly: true,
      shortCircuitThreshold,
    };
  }

  // --- Round 2: reuse Lane A `metadata.spam_providers` (CI-3.1.3) ---
  const laneA = evaluateLaneASpamProvidersRound2(
    subjectContext.metadata,
    subjectContext.subjectCreatedAt,
    params.env,
  );
  if (laneA.reusedLaneA) {
    rawResults.round_2 = {
      reused_lane_a: true,
      providers: laneA.rawByProvider,
      skipped_reason: laneA.skippedReason,
    };
  }
  if (laneA.hits.length > 0) {
    allSources.push(...laneA.hits);
    synthesis = mergeSynthesis(synthesis, buildRound2Synthesis(laneA.hits));
    rounds.push({
      round: 2,
      hits: laneA.hits,
      stoppedEarly: false,
    });
    roundAudits.push({
      round: 2,
      sourceTiers: laneA.hits.map((h) => h.tier),
      stoppedEarly: false,
    });
  } else {
    roundAudits.push({
      round: 2,
      sourceTiers: [],
      stoppedEarly: false,
      skippedReason: laneA.skippedReason,
    });
  }

  const stoppedAfterRound2 = shouldStopCompanyIntelligenceOrchestrator({
    sources: allSources,
    synthesis,
    skipPaidRounds,
    shortCircuitThreshold,
  });

  if (stoppedAfterRound2) {
    if (!synthesis && allSources.length > 0) {
      synthesis = buildSynthesisFromSourceHits(allSources);
    }
    return {
      ...empty,
      durationMs: Date.now() - started,
      synthesis,
      allSources,
      rounds,
      roundAudits,
      rawResults,
      skipPaidRounds,
      stoppedEarly: true,
      shortCircuitThreshold,
    };
  }

  // --- Rounds 3–4: SerpAPI + OpenRouter (**CI-4**) — gated by CI-P.5.1 ---
  const paidAllowed = shouldRunPaidIntelRounds(
    { authenticatedUserId: subjectContext.authenticatedUserId },
    params.env,
  );
  roundAudits.push({
    round: 3,
    sourceTiers: [],
    stoppedEarly: false,
    skippedReason: skipPaidRounds
      ? "seed_short_circuit"
      : !paidAllowed
        ? "anonymous_paid_rounds_disabled"
        : "ci_4_not_implemented",
  });

  if (!synthesis && allSources.length > 0) {
    synthesis = buildSynthesisFromSourceHits(allSources);
  }

  return {
    ...empty,
    durationMs: Date.now() - started,
    synthesis,
    allSources,
    rounds,
    roundAudits,
    rawResults,
    skipPaidRounds,
    stoppedEarly: stoppedAfterRound2,
    shortCircuitThreshold,
  };
}
