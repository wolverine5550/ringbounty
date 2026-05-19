/**
 * CI-3.1 — Lane B agent orchestrator (Rounds 1–4: seed, Lane A, SerpAPI, OpenRouter synthesis).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  computeCompanyIntelRunCost,
  isSerpapiBilled,
  type CompanyIntelRunCost,
} from "./company-intel-run-cost";
import type { CompanyIntelligenceEnv } from "./company-intelligence-flags";
import { loadClaimSubjectIntelContext } from "./load-claim-subject-intel-context";
import {
  getCompanyIntelShortCircuitThreshold,
} from "./orchestrator-policy";
import { shouldStopCompanyIntelligenceOrchestrator } from "./orchestrator-short-circuit";
import { shouldRunPaidIntelRounds } from "./paid-intel-rounds";
import {
  synthesizeCompanyFromSources,
  synthesisResultToRound4Payload,
} from "./synthesize-company-from-sources";
import { buildSynthesisFromSourceHits } from "./synthesize-from-sources";
import { evaluateLaneASpamProvidersRound2 } from "./sources/lane-a-spam-providers";
import {
  scrapeComplaintSites,
  scrapeResultToComplaintSitePayload,
} from "./sources/scrape-complaint-sites";
import {
  searchComplaintSnippetsViaSerpapi,
  serpapiResultToRound3Payload,
} from "./sources/serpapi-complaint-search";
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
  /** Audit trail for OpenRouter Round 4 (CI-4.2). */
  openrouterPrompt: string | null;
  openrouterResponse: string | null;
  /** Path A seed short-circuit — skip SerpAPI/OpenRouter (**CI-4**). */
  skipPaidRounds: boolean;
  stoppedEarly: boolean;
  shortCircuitThreshold: number;
  /** CI-4.3 — estimated SerpAPI + OpenRouter marginal cost for this run. */
  costEstimate: CompanyIntelRunCost;
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
    openrouterPrompt: null,
    openrouterResponse: null,
    skipPaidRounds: false,
    stoppedEarly: false,
    shortCircuitThreshold,
    costEstimate: { estimatedCostCents: 0, apisCalled: [] },
  };

  const allSources: IntelSourceHit[] = [];
  const rounds: AgentRoundResult[] = [];
  const roundAudits: CompanyIntelligenceRoundAudit[] = [];
  const rawResults: Record<string, unknown> = {};
  let synthesis: SynthesisResult | null = null;
  let skipPaidRounds = false;
  let openrouterPrompt: string | null = null;
  let openrouterResponse: string | null = null;
  let serpapiBilled = false;
  let openRouterHttpAttempts = 0;

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

  // --- Rounds 3–4: SerpAPI (**CI-4.1**) + OpenRouter synthesis (**CI-4.2**) — CI-P.5.1 ---
  const paidAllowed = shouldRunPaidIntelRounds(
    { authenticatedUserId: subjectContext.authenticatedUserId },
    params.env,
  );

  if (skipPaidRounds) {
    roundAudits.push({
      round: 3,
      sourceTiers: [],
      stoppedEarly: false,
      skippedReason: "seed_short_circuit",
    });
  } else if (!paidAllowed) {
    roundAudits.push({
      round: 3,
      sourceTiers: [],
      stoppedEarly: false,
      skippedReason: "anonymous_paid_rounds_disabled",
    });
  } else {
    const serp = await searchComplaintSnippetsViaSerpapi(
      params.phoneNumberNormalized,
      { env: params.env },
    );
    serpapiBilled = isSerpapiBilled(serp);
    const round3 = serpapiResultToRound3Payload(serp);
    rawResults.round_3 = round3.rawResultsSlice;

    if (round3.hits.length > 0) {
      allSources.push(...round3.hits);
      rounds.push({
        round: 3,
        hits: round3.hits,
        stoppedEarly: false,
      });
    }

    roundAudits.push({
      round: 3,
      sourceTiers: round3.hits.map((h) => h.tier),
      stoppedEarly: false,
      skippedReason: round3.auditSkippedReason,
    });

    // CI-5.1 — optional direct complaint-site scrape (after SerpAPI, before synthesis).
    const scrape = await scrapeComplaintSites(params.phoneNumberNormalized, {
      env: params.env,
    });
    const scrapePayload = scrapeResultToComplaintSitePayload(scrape);
    rawResults.complaint_site_scrape = scrapePayload.rawResultsSlice.complaint_site_scrape;
    if (scrapePayload.hits.length > 0) {
      allSources.push(...scrapePayload.hits);
    }
    if (scrapePayload.auditSkippedReason && scrape.comments.length === 0) {
      roundAudits.push({
        round: 3,
        sourceTiers: [],
        stoppedEarly: false,
        skippedReason: scrapePayload.auditSkippedReason,
      });
    } else if (scrape.comments.length > 0) {
      roundAudits.push({
        round: 3,
        sourceTiers: ["complaint_site_scrape"],
        stoppedEarly: false,
        skippedReason: null,
      });
    }

    // CI-4.2 — OpenRouter synthesis from accumulated sources + SerpAPI + scrape comments.
    const openRouter = await synthesizeCompanyFromSources(
      {
        phoneNumberNormalized: params.phoneNumberNormalized,
        sources: allSources,
        serpapiSnippets: serp.snippets,
        complaintSiteComments: scrape.comments,
      },
      { env: params.env },
    );
    openRouterHttpAttempts = openRouter.httpAttempts;

    if (openRouter.ok) {
      openrouterPrompt = openRouter.prompt;
      openrouterResponse = openRouter.response;
      const round4 = synthesisResultToRound4Payload(openRouter);
      rawResults.round_4 = round4.rawResultsSlice;
      allSources.push(round4.hit);
      synthesis = mergeSynthesis(synthesis, openRouter.synthesis);
      rounds.push({
        round: 4,
        hits: [round4.hit],
        stoppedEarly: false,
      });
      roundAudits.push({
        round: 4,
        sourceTiers: ["openrouter_synthesis"],
        stoppedEarly: false,
        skippedReason: null,
      });
    } else {
      rawResults.round_4 = {
        openrouter: {
          skipped: true,
          reason: openRouter.skippedReason,
          error: openRouter.error ?? null,
        },
      };
      roundAudits.push({
        round: 4,
        sourceTiers: [],
        stoppedEarly: false,
        skippedReason: `openrouter_${openRouter.skippedReason}`,
      });
    }
  }

  if (!synthesis && allSources.length > 0) {
    synthesis = buildSynthesisFromSourceHits(allSources);
  }

  const costEstimate = computeCompanyIntelRunCost(
    { serpapiBilled, openRouterHttpAttempts },
    params.env,
  );

  return {
    ...empty,
    durationMs: Date.now() - started,
    synthesis,
    allSources,
    rounds,
    roundAudits,
    rawResults,
    openrouterPrompt,
    openrouterResponse,
    skipPaidRounds,
    stoppedEarly: stoppedAfterRound2,
    shortCircuitThreshold,
    costEstimate,
  };
}
