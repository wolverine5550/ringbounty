/**
 * Company Intelligence Agent — source confidence + auto-promote policy (CI-0.3 / CI-P.4).
 *
 * v1 ship default (**CI-P.4.1**): `shouldPromoteToIdentified` returns `false` unless
 * `COMPANY_INTEL_AUTO_PROMOTE_ENABLED=true` (not set in production).
 */

import { getCompanyIntelligenceFeatureFlags } from "@/lib/company-intelligence/company-intelligence-flags";
import type { CompanyIntelligenceEnv } from "@/lib/company-intelligence/company-intelligence-flags";
import type { IntelSourceHit, SourceTier } from "@/lib/company-intelligence/types";
import { isSubstantiveCompanyName } from "@/lib/constants/company-identification";

/**
 * Baseline 0–100 scores per source tier (product spec + CI-P.2 Path B adjustments).
 * FTC bulk has no legal entity name — complaint tiers inform suggest UX only.
 */
export const SOURCE_CONFIDENCE: Readonly<Record<SourceTier, number>> = {
  ftc_enforcement: 95,
  ftc_complaint_high: 85,
  ftc_complaint_medium: 70,
  ftc_complaint_low: 55,
  callback_confirmed: 90,
  voicemail_transcription: 95,
  nomorobo: 88,
  youmail: 60,
  whitepages: 40,
  serpapi: 50,
  openrouter_synthesis: 55,
  complaint_site_scrape: 45,
};

/**
 * v2 auto-promote allowlist (**CI-P.4.3**). Requires `COMPANY_INTEL_AUTO_PROMOTE_ENABLED`.
 * `ftc_enforcement` only when bulk/seed includes a substantive legal name (CI-P.2 Path A);
 * Path B bulk does not qualify.
 */
export const V2_AUTO_PROMOTE_TIERS: ReadonlySet<SourceTier> = new Set([
  "voicemail_transcription",
  "callback_confirmed",
  "ftc_enforcement",
]);

/** Web / LLM tiers that must not auto-promote without a v2 allowlist tier + user path (CI-P.4.3). */
export const V2_NEVER_AUTO_PROMOTE_ALONE_TIERS: ReadonlySet<SourceTier> =
  new Set([
    "serpapi",
    "openrouter_synthesis",
    "complaint_site_scrape",
    "whitepages",
    "youmail",
    "ftc_complaint_high",
    "ftc_complaint_medium",
    "ftc_complaint_low",
  ]);

/** Minimum aggregated confidence before v2 auto-promote is considered. */
export const V2_AUTO_PROMOTE_MIN_CONFIDENCE = 85;

/**
 * Resolves per-hit confidence (explicit override or tier map).
 */
export function confidenceForSource(hit: IntelSourceHit): number {
  if (hit.confidence !== undefined) {
    return hit.confidence;
  }
  return SOURCE_CONFIDENCE[hit.tier];
}

/**
 * Aggregates multiple source hits: when names agree (case-insensitive trim), take the max
 * confidence among agreeing hits; otherwise take the max single-hit confidence.
 */
export function computeAggregatedConfidence(sources: IntelSourceHit[]): number {
  if (sources.length === 0) {
    return 0;
  }

  const substantive = sources.filter((s) =>
    isSubstantiveCompanyName(s.companyName),
  );
  const pool = substantive.length > 0 ? substantive : sources;

  const byNormalizedName = new Map<string, number>();
  for (const hit of pool) {
    const name = hit.companyName?.trim().toLowerCase() ?? "";
    const score = confidenceForSource(hit);
    if (name.length >= 2) {
      byNormalizedName.set(name, Math.max(byNormalizedName.get(name) ?? 0, score));
    }
  }

  if (byNormalizedName.size > 0) {
    return Math.max(...byNormalizedName.values());
  }

  return Math.max(...pool.map((h) => confidenceForSource(h)));
}

/**
 * Whether agent output may set `company_identified=true` on the subject.
 *
 * **v1 (CI-P.4.1):** Always `false` when `COMPANY_INTEL_AUTO_PROMOTE_ENABLED` is unset/false.
 * **v2 (CI-P.4.3):** Only when flag is on, aggregated confidence ≥ threshold, at least one
 * `V2_AUTO_PROMOTE_TIERS` hit with substantive name, and no “web/LLM only” promotion path.
 */
export function shouldPromoteToIdentified(
  input: {
    sources: IntelSourceHit[];
    aggregatedConfidence?: number;
  },
  env: CompanyIntelligenceEnv = process.env,
): boolean {
  const { autoPromoteEnabled } = getCompanyIntelligenceFeatureFlags(env);

  // CI-P.4.1 — locked for first agent ship.
  if (!autoPromoteEnabled) {
    return false;
  }

  const confidence =
    input.aggregatedConfidence ?? computeAggregatedConfidence(input.sources);

  if (confidence < V2_AUTO_PROMOTE_MIN_CONFIDENCE) {
    return false;
  }

  const promotableHits = input.sources.filter(
    (s) =>
      V2_AUTO_PROMOTE_TIERS.has(s.tier) &&
      isSubstantiveCompanyName(s.companyName),
  );
  if (promotableHits.length === 0) {
    return false;
  }

  const substantiveTiers = new Set(
    input.sources
      .filter((s) => isSubstantiveCompanyName(s.companyName))
      .map((s) => s.tier),
  );

  const onlyWebIntel =
    substantiveTiers.size > 0 &&
    [...substantiveTiers].every((t) => V2_NEVER_AUTO_PROMOTE_ALONE_TIERS.has(t));

  if (onlyWebIntel) {
    return false;
  }

  return true;
}
