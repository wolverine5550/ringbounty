/**
 * Company Intelligence Agent — shared types (CI-0.2.2 / CI-P.4).
 *
 * Used by confidence scoring and (later) orchestrator + source adapters.
 * DB enums mirror `company_intelligence_runs.status` / `claim_subjects.company_intel_status`.
 */

/** Async worker + subject lifecycle (CI-0.1.2 / CI-0.1.3). */
export type CompanyIntelRunStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

/** OpenRouter synthesis output shape (CI-3 / CI-4). */
export type SynthesisResult = {
  companyName: string | null;
  confidence: number;
  reasoning: string;
  callCategory?: string | null;
  callbackNumbers: string[];
  isSpoofedPool: boolean;
  contradictions?: string | null;
};

/** One orchestrator round before synthesis (CI-3.1). */
export type AgentRoundResult = {
  round: number;
  hits: IntelSourceHit[];
  stoppedEarly: boolean;
};

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
