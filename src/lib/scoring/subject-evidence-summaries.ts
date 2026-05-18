/**
 * Phase 8.4.1 — Plain-language spam / DNC summaries for `/results` subject cards.
 */

import { resolveSpamDbMatrixSignal } from "@/lib/scoring/spam-db-matrix-signal";

import {
  mergedSpamFromClaimSubject,
  type ClaimSubjectSpamRow,
} from "./merged-spam-from-subject";
import type { DncRowForStrength } from "./build-strength-matrix-input";

/** One-line spam database summary for a subject card. */
export function buildSpamSummary(row: ClaimSubjectSpamRow): string {
  if (row.is_exempt) {
    return "Spam check skipped — this call type is exempt from TCPA screening.";
  }

  const signal = resolveSpamDbMatrixSignal(mergedSpamFromClaimSubject(row));
  const score = row.spam_db_confidence_score;

  if (signal.tier === "high") {
    return `Listed in spam databases with high confidence${score !== null ? ` (score ${score})` : ""}.`;
  }
  if (signal.tier === "low") {
    return `Listed in spam databases with lower confidence${score !== null ? ` (score ${score})` : ""}.`;
  }
  return "No strong spam-database match for this number.";
}

/** One-line DNC summary for a subject card (after qualification / `dnc_check_results`). */
export function buildDncSummary(dnc: DncRowForStrength | null): string {
  if (!dnc) {
    return "Do-not-call status will appear here after you complete the qualification questions.";
  }

  const parts: string[] = [];

  if (dnc.federal_dnc_registered === true) {
    parts.push(
      dnc.federal_dnc_eligible === true
        ? "Federal Do Not Call: registered and eligible (31+ days before calls)."
        : "Federal Do Not Call: registered (eligibility depends on registration date).",
    );
  } else if (dnc.federal_dnc_registered === false) {
    parts.push("Federal Do Not Call: not registered (per your attestation).");
  }

  if (dnc.state_dnc_applicable === true) {
    parts.push(
      dnc.state_dnc_registered === true
        ? "State registry: on file for your state."
        : "State registry: applicable but not on file.",
    );
  }

  if (parts.length === 0) {
    return "Federal and state DNC status not yet confirmed.";
  }

  return parts.join(" ");
}
