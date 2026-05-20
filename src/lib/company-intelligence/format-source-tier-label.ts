/**
 * CI-8.4.2 — Human-readable labels for Lane B source tiers (evidence PDF / attorney-facing).
 */

import type { SourceTier } from "./types";

const SOURCE_TIER_LABELS: Readonly<Record<SourceTier, string>> = {
  ftc_enforcement: "FTC enforcement actions database",
  ftc_complaint_high: "FTC consumer complaint database (high volume)",
  ftc_complaint_medium: "FTC consumer complaint database (medium volume)",
  ftc_complaint_low: "FTC consumer complaint database (low volume)",
  callback_confirmed: "Callback number lookup (confirmed)",
  voicemail_transcription: "Voicemail transcription",
  nomorobo: "Nomorobo spam reputation check",
  youmail: "YouMail spam reputation check",
  whitepages: "Whitepages caller ID",
  serpapi: "Web complaint search (SerpAPI)",
  openrouter_synthesis: "AI synthesis across sources (OpenRouter)",
  complaint_site_scrape: "Complaint site scrape",
};

/**
 * Maps orchestrator `sourceTiers` values to plain-language labels for PDFs.
 */
export function formatSourceTierLabel(tier: string): string {
  if (tier in SOURCE_TIER_LABELS) {
    return SOURCE_TIER_LABELS[tier as SourceTier];
  }
  return tier.replace(/_/g, " ");
}
