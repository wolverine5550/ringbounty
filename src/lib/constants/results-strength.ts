/**
 * Phase 8.4.3 — `/results` strength copy and styling (informational; not legal advice).
 *
 * Placeholder until lawyer-reviewed final copy (task_manager open questions).
 */

import type { ClaimStrengthGate } from "@/lib/claims/successful-query";
import type { StrengthMatrixStrength } from "@/lib/scoring/strength-matrix";

export type ResultsStrengthTone = "green" | "yellow" | "orange" | "red";

export type ResultsStrengthDisplay = {
  label: string;
  headline: string;
  body: string;
  tone: ResultsStrengthTone;
};

const STRENGTH_DISPLAY: Record<
  Exclude<StrengthMatrixStrength, never>,
  ResultsStrengthDisplay
> = {
  strong: {
    label: "Strong",
    headline: "Higher likelihood this is worth discussing with an attorney",
    body: "Based on what you shared, several TCPA-related signals line up. An attorney can review your facts and explain options — we do not guarantee any outcome.",
    tone: "green",
  },
  moderate: {
    label: "Moderate",
    headline: "Moderate likelihood this is worth discussing with an attorney",
    body: "You have some supporting evidence, but parts may be harder to prove. An attorney can help you understand whether pursuit makes sense for your situation.",
    tone: "yellow",
  },
  weak: {
    label: "Weak",
    headline: "Lower likelihood this is worth discussing with an attorney",
    body: "This claim looks weaker on the factors we can see. An attorney can still advise whether anything is worth pursuing — we do not recommend or guarantee recovery.",
    tone: "orange",
  },
  ineligible: {
    label: "Ineligible",
    headline: "Unlikely to qualify as a TCPA violation based on what you shared",
    body: "We do not think this meets our TCPA screening threshold. You can save your information for reference or ask us to notify you about future options.",
    tone: "red",
  },
};

/** UI copy + tone for a strength band (§8.4.3). */
export function getResultsStrengthDisplay(
  strength: StrengthMatrixStrength,
): ResultsStrengthDisplay {
  return STRENGTH_DISPLAY[strength];
}

/** Checkbox label before attorney CTA when strength is `weak` (§8.4.3). */
export const RESULTS_WEAK_STRENGTH_ACK_LABEL =
  "I understand this claim is weaker and still want to connect with an attorney for a free review.";

/** Valuation scenario row labels (§8.4.2 — informational estimates, not a demand). */
export const VALUATION_SCENARIO_LABELS = {
  conservativeLow: "Conservative (low estimate)",
  conservativeHigh: "Conservative (high estimate)",
  realistic: "Realistic estimate",
  maximum: "Maximum (if willful)",
} as const;

export const VALUATION_INFORMATIONAL_NOTE =
  "These dollar ranges are informational estimates under 47 U.S.C. § 227. They are not a recommended demand amount.";

/** Badge label for aggregate strength when persisted column is still null (§8.5 pending). */
export function formatClaimStrengthBadge(
  strength: ClaimStrengthGate | StrengthMatrixStrength,
): string {
  if (!strength) {
    return "Pending";
  }
  return getResultsStrengthDisplay(strength as StrengthMatrixStrength).label;
}
