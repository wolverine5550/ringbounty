/**
 * CI-2.2 — Local `seed_violations` lookup, Round 1 evaluation, agent write-back.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { isSubstantiveCompanyName } from "@/lib/constants/company-identification";
import type { Database } from "@/types/database";

import { SOURCE_CONFIDENCE } from "../confidence";
import type { IntelSourceHit, SourceTier, SynthesisResult } from "../types";
import {
  parseSeedViolationMetadata,
  type SeedViolationMetadata,
} from "./seed-violation-metadata";
import {
  SEED_HIGH_COMPLAINT_COUNT_THRESHOLD,
  SEED_PATH_A_SHORT_CIRCUIT_CONFIDENCE,
} from "./seed-violations-policy";

export type { SeedViolationMetadata } from "./seed-violation-metadata";
export {
  SEED_HIGH_COMPLAINT_COUNT_THRESHOLD,
  SEED_PATH_A_SHORT_CIRCUIT_CONFIDENCE,
} from "./seed-violations-policy";

/** Normalized row from `seed_violations` (no consumer PII). */
export type SeedViolationLookup = {
  phoneNumberNormalized: string;
  reportedCompanyName: string | null;
  confidenceLevel: string;
  violationCount: number;
  source: string;
  litigationStatus: string | null;
  metadata: SeedViolationMetadata | null;
};

export type SeedRound1Evaluation = {
  hits: IntelSourceHit[];
  synthesis: SynthesisResult | null;
  /** True when Path A high-confidence name hit — SerpAPI/synthesis rounds may be skipped (CI-4). */
  skipPaidRounds: boolean;
  stoppedEarly: boolean;
};

const FTC_COMPLAINT_TIERS: ReadonlySet<SourceTier> = new Set([
  "ftc_complaint_high",
  "ftc_complaint_medium",
  "ftc_complaint_low",
  "ftc_enforcement",
]);

/** CI-2.2.1 — Instant local lookup before paid agent rounds. */
export async function querySeedViolations(
  admin: SupabaseClient<Database>,
  phoneNumberNormalized: string,
): Promise<SeedViolationLookup | null> {
  const { data, error } = await admin
    .from("seed_violations")
    .select(
      "phone_number_normalized, reported_company_name, confidence_level, violation_count, source, litigation_status, metadata",
    )
    .eq("phone_number_normalized", phoneNumberNormalized)
    .maybeSingle();

  if (error) {
    throw new Error(`seed_violations lookup failed: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  return {
    phoneNumberNormalized: data.phone_number_normalized,
    reportedCompanyName: data.reported_company_name,
    confidenceLevel: data.confidence_level,
    violationCount: data.violation_count,
    source: data.source,
    litigationStatus: data.litigation_status,
    metadata: parseSeedViolationMetadata(data.metadata),
  };
}

function effectiveComplaintCount(seed: SeedViolationLookup): number {
  const fromMetadata = seed.metadata?.complaint_count;
  if (typeof fromMetadata === "number" && fromMetadata > 0) {
    return Math.max(seed.violationCount, fromMetadata);
  }
  return seed.violationCount;
}

function tierFromConfidenceLevel(level: string): SourceTier {
  if (FTC_COMPLAINT_TIERS.has(level as SourceTier)) {
    return level as SourceTier;
  }
  if (level === "ftc_enforcement") {
    return "ftc_enforcement";
  }
  return "ftc_complaint_medium";
}

function buildSeedHit(seed: SeedViolationLookup): IntelSourceHit {
  const tier = tierFromConfidenceLevel(seed.confidenceLevel);
  return {
    tier,
    companyName: seed.reportedCompanyName,
    confidence: SOURCE_CONFIDENCE[tier],
  };
}

/**
 * CI-2.2.2 — Path A: high count + substantive name → confidence 85, skip paid rounds.
 * Path B: high count → category suggest only; paid rounds still allowed when name missing.
 */
export function evaluateSeedViolationRound1(
  seed: SeedViolationLookup,
): SeedRound1Evaluation {
  const hits = [buildSeedHit(seed)];
  const count = effectiveComplaintCount(seed);
  const substantiveName = isSubstantiveCompanyName(seed.reportedCompanyName);

  if (
    substantiveName &&
    count > SEED_HIGH_COMPLAINT_COUNT_THRESHOLD
  ) {
    const category = seed.metadata?.ftc_subject ?? null;
    return {
      hits,
      synthesis: {
        companyName: seed.reportedCompanyName,
        confidence: SEED_PATH_A_SHORT_CIRCUIT_CONFIDENCE,
        reasoning: `Seed cache: ${count} FTC-linked complaints with reported company name "${seed.reportedCompanyName}". Suggest-only until user confirms on qualify (CI-P.4).`,
        callCategory: category,
        callbackNumbers: [],
        isSpoofedPool: false,
      },
      skipPaidRounds: true,
      stoppedEarly: true,
    };
  }

  if (count > SEED_HIGH_COMPLAINT_COUNT_THRESHOLD) {
    const category =
      seed.metadata?.ftc_subject?.trim() || "No Subject Provided";
    const tier = tierFromConfidenceLevel(seed.confidenceLevel);
    const confidence = SOURCE_CONFIDENCE[tier];
    return {
      hits,
      synthesis: {
        companyName: null,
        confidence,
        reasoning: `FTC consumer complaints (${count}) most often categorized as "${category}". This is a complaint category, not a verified legal entity name — confirm the company on qualify step 4 (Path B).`,
        callCategory: category,
        callbackNumbers: [],
        isSpoofedPool: false,
      },
      skipPaidRounds: false,
      stoppedEarly: true,
    };
  }

  return {
    hits,
    synthesis: null,
    skipPaidRounds: false,
    stoppedEarly: false,
  };
}

export type WriteBackSeedViolationFromAgentParams = {
  phoneNumberNormalized: string;
  companyName: string;
  confidence: number;
  claimSubjectId?: string;
  runId?: string;
};

/**
 * CI-2.2.3 — Compound cache when agent finds a substantive company name (later rounds).
 */
export async function writeBackSeedViolationFromAgent(
  admin: SupabaseClient<Database>,
  params: WriteBackSeedViolationFromAgentParams,
): Promise<void> {
  const name = params.companyName.trim();
  if (!isSubstantiveCompanyName(name)) {
    return;
  }

  const now = new Date().toISOString();
  const { error } = await admin.from("seed_violations").upsert(
    {
      phone_number_normalized: params.phoneNumberNormalized,
      reported_company_name: name,
      confidence_level: "nomorobo",
      violation_count: 1,
      source: "company_intelligence_agent",
      litigation_status: null,
      last_refreshed_at: now,
      metadata: {
        agent_writeback: true,
        synthesized_confidence: params.confidence,
        claim_subject_id: params.claimSubjectId,
        run_id: params.runId,
      },
    },
    { onConflict: "phone_number_normalized" },
  );

  if (error) {
    throw new Error(`seed_violations write-back failed: ${error.message}`);
  }
}
