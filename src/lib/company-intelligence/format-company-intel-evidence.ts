/**
 * CI-8.4.2 — Format Lane B agent metadata for attorney evidence PDF (no raw scrape payloads).
 */

import type { CompanyIntelligenceRoundAudit } from "./run-company-intelligence-agent";
import { formatSourceTierLabel } from "./format-source-tier-label";

/** Per-subject snapshot loaded from `company_intelligence_runs` + subject reasoning fallback. */
export type CompanyIntelEvidenceSnapshot = {
  suggestedCompanyName: string | null;
  confidence: number | null;
  reasoning: string | null;
  roundAudits: CompanyIntelligenceRoundAudit[];
  apisCalled: string[] | null;
};

function isRoundAudit(value: unknown): value is CompanyIntelligenceRoundAudit {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const row = value as Record<string, unknown>;
  return typeof row.round === "number" && Array.isArray(row.sourceTiers);
}

/**
 * Parses `company_intelligence_runs.sources_queried` JSON into round audits.
 */
export function parseCompanyIntelRoundAudits(
  sourcesQueried: unknown,
): CompanyIntelligenceRoundAudit[] {
  if (!Array.isArray(sourcesQueried)) {
    return [];
  }
  return sourcesQueried.filter(isRoundAudit);
}

/**
 * Builds PDF key/value lines for automated company research (informational; not legal advice).
 */
export function formatCompanyIntelEvidenceLines(
  snapshot: CompanyIntelEvidenceSnapshot | null,
): string[] {
  if (!snapshot) {
    return [];
  }

  const lines: string[] = [];
  const hasSuggestion =
    snapshot.suggestedCompanyName && snapshot.suggestedCompanyName.trim().length > 0;
  const hasReasoning =
    snapshot.reasoning && snapshot.reasoning.trim().length > 0;
  const hasRounds = snapshot.roundAudits.length > 0;
  const hasApis = (snapshot.apisCalled?.length ?? 0) > 0;

  if (!hasSuggestion && !hasReasoning && !hasRounds && !hasApis) {
    return [];
  }

  if (hasSuggestion) {
    const confidenceSuffix =
      snapshot.confidence !== null ? ` (confidence ${snapshot.confidence})` : "";
    lines.push(
      `Suggested company: ${snapshot.suggestedCompanyName!.trim()}${confidenceSuffix}`,
    );
  }

  if (hasReasoning) {
    lines.push(`Research summary: ${snapshot.reasoning!.trim()}`);
  }

  for (const audit of snapshot.roundAudits) {
    const tierLabels = audit.sourceTiers.map(formatSourceTierLabel);
    if (tierLabels.length > 0) {
      lines.push(`Round ${audit.round}: ${tierLabels.join("; ")}`);
    } else if (audit.skippedReason) {
      lines.push(`Round ${audit.round}: skipped (${audit.skippedReason})`);
    } else {
      lines.push(`Round ${audit.round}: no sources`);
    }
    if (audit.stoppedEarly) {
      lines.push(`Round ${audit.round}: pipeline stopped early after this round`);
    }
  }

  if (hasApis) {
    lines.push(`Billable APIs invoked: ${snapshot.apisCalled!.join(", ")}`);
  }

  return lines;
}
