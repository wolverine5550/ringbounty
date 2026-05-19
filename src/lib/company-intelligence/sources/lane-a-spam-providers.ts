/**
 * CI-3.1.3 — Round 2: reuse Lane A `claim_subjects.metadata` (no duplicate Nomorobo HTTP).
 */

import { isSubstantiveCompanyName } from "@/lib/constants/company-identification";
import type { CompanyIntelligenceEnv } from "@/lib/company-intelligence/company-intelligence-flags";
import {
  isLaneASpamMetadataStale,
  getLaneAMetadataReuseMaxAgeMs,
} from "@/lib/company-intelligence/orchestrator-policy";
import {
  mapNomoroboCheckJsonToSpamCheckResult,
  type NomoroboCheckResponse,
} from "@/lib/spam/nomorobo-spam-provider";
import { isSkippedSpamResult } from "@/lib/spam/merge-spam-results";
import type { SpamCheckResult } from "@/lib/spam/types";

import type { IntelSourceHit } from "../types";

export type LaneASpamProvidersRound2Result = {
  hits: IntelSourceHit[];
  /** Provider id → raw JSON reused from check submit. */
  rawByProvider: Record<string, unknown>;
  /** False when metadata missing or subject row is stale (CI-3.1.3). */
  reusedLaneA: boolean;
  skippedReason: "missing_metadata" | "stale_subject" | "no_usable_providers" | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseSpamCheckResultFromStoredRaw(
  providerId: string,
  raw: unknown,
): SpamCheckResult | null {
  if (!isRecord(raw) || raw.skipped === true) {
    return null;
  }

  if (providerId === "nomorobo") {
    return mapNomoroboCheckJsonToSpamCheckResult(raw as NomoroboCheckResponse);
  }

  if (providerId === "twilio") {
    const callerName =
      typeof raw.caller_name === "string"
        ? raw.caller_name
        : typeof raw.callerName === "string"
          ? raw.callerName
          : null;
    return {
      isSpam: false,
      score: null,
      complaints: null,
      category: null,
      companyName: callerName?.trim() || null,
      raw,
      providerId: "twilio",
    };
  }

  return null;
}

function whitepagesHitFromMetadata(
  metadata: Record<string, unknown>,
): IntelSourceHit | null {
  const suggested =
    typeof metadata.whitepages_suggested_company_name === "string"
      ? metadata.whitepages_suggested_company_name
      : null;
  const lookup = isRecord(metadata.whitepages_lookup)
    ? metadata.whitepages_lookup
    : null;
  const fromLookup =
    lookup && typeof lookup.company_name === "string"
      ? lookup.company_name
      : null;
  const name = (suggested ?? fromLookup)?.trim() ?? null;
  if (!name) {
    return null;
  }
  return {
    tier: "whitepages",
    companyName: name,
  };
}

/**
 * CI-3.1.3 — Extract intel hits from persisted Lane A provider payloads.
 */
export function evaluateLaneASpamProvidersRound2(
  metadata: unknown,
  subjectCreatedAtIso: string | null | undefined,
  env?: CompanyIntelligenceEnv,
): LaneASpamProvidersRound2Result {
  const empty: LaneASpamProvidersRound2Result = {
    hits: [],
    rawByProvider: {},
    reusedLaneA: false,
    skippedReason: "missing_metadata",
  };

  if (!isRecord(metadata)) {
    return empty;
  }

  const maxAgeMs = getLaneAMetadataReuseMaxAgeMs(env);
  if (isLaneASpamMetadataStale(subjectCreatedAtIso, Date.now(), maxAgeMs)) {
    return {
      ...empty,
      skippedReason: "stale_subject",
    };
  }

  const hits: IntelSourceHit[] = [];
  const rawByProvider: Record<string, unknown> = {};

  const spamProviders = metadata.spam_providers;
  if (isRecord(spamProviders)) {
    for (const [providerId, raw] of Object.entries(spamProviders)) {
      const parsed = parseSpamCheckResultFromStoredRaw(providerId, raw);
      if (!parsed || isSkippedSpamResult(parsed)) {
        continue;
      }
      rawByProvider[providerId] = parsed.raw;

      if (providerId === "nomorobo" && isSubstantiveCompanyName(parsed.companyName)) {
        hits.push({
          tier: "nomorobo",
          companyName: parsed.companyName,
        });
      }

      if (
        providerId === "twilio" &&
        parsed.companyName &&
        !isSubstantiveCompanyName(parsed.companyName)
      ) {
        hits.push({
          tier: "whitepages",
          companyName: parsed.companyName,
          confidence: 35,
        });
      }
    }
  }

  const wpHit = whitepagesHitFromMetadata(metadata);
  if (wpHit) {
    hits.push(wpHit);
    if (isRecord(metadata.whitepages_lookup)) {
      rawByProvider.whitepages = metadata.whitepages_lookup;
    }
  }

  if (hits.length === 0 && Object.keys(rawByProvider).length === 0) {
    return {
      hits: [],
      rawByProvider: {},
      reusedLaneA: false,
      skippedReason: "no_usable_providers",
    };
  }

  return {
    hits,
    rawByProvider,
    reusedLaneA: Object.keys(rawByProvider).length > 0,
    skippedReason: hits.length === 0 ? "no_usable_providers" : null,
  };
}
