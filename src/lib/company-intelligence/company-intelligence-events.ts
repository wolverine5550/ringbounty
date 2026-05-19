/**
 * CI-3.2.2 — Canonical `claim_events` keys for Lane B agent completion (CI-P.3.2).
 */

import type { ClaimEventSource, ClaimEventType } from "@/lib/constants/claimEvent";

/** `claim_events.event_type` for agent worker rows. */
export const COMPANY_INTELLIGENCE_EVENT_TYPE =
  "company_intelligence" as const satisfies ClaimEventType;

/** `claim_events.source` for agent worker rows. */
export const COMPANY_INTELLIGENCE_EVENT_SOURCE =
  "company_intelligence" as const satisfies ClaimEventSource;

/** Completion marker — value `"true"` when a run finishes successfully. */
export const COMPANY_INTELLIGENCE_COMPLETED_KEY =
  "company_intelligence_completed" as const;

/** Suggested defendant name from synthesis (audit mirror of `claim_subjects.company_name_suggested`). */
export const COMPANY_NAME_SUGGESTED_EVENT_KEY = "company_name_suggested" as const;

/** Qualify-namespace provenance key (not `company_name_source` from spam path). */
export const COMPANY_IDENTIFICATION_SOURCE_KEY =
  "company_identification_source" as const;

/** Estimated Lane B paid API cost in USD cents (CI-4.3). */
export const COMPANY_INTEL_ESTIMATED_COST_CENTS_KEY =
  "company_intel_estimated_cost_cents" as const;

/** JSON array of billable API ids, e.g. `["serpapi","openrouter"]` (CI-4.3). */
export const COMPANY_INTEL_APIS_CALLED_KEY = "company_intel_apis_called" as const;
