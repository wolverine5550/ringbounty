/**
 * Company Intelligence Agent — shared types (CI-0.2.2 / CI-P.4).
 *
 * Used by confidence scoring and (later) orchestrator + source adapters.
 */

/** Per-source tier labels for confidence aggregation and v2 auto-promote policy. */
export type SourceTier =
  | "ftc_enforcement"
  | "ftc_complaint_high"
  | "ftc_complaint_medium"
  | "ftc_complaint_low"
  | "callback_confirmed"
  | "voicemail_transcription"
  | "nomorobo"
  | "youmail"
  | "whitepages"
  | "serpapi"
  | "openrouter_synthesis"
  | "complaint_site_scrape";

/** One hit from a round-1+ source before synthesis. */
export type IntelSourceHit = {
  tier: SourceTier;
  /** Normalized company string when the source supplies one (may be null for Path B FTC). */
  companyName: string | null;
  /** Optional per-source score override; defaults to `SOURCE_CONFIDENCE[tier]`. */
  confidence?: number;
};
