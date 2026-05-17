/**
 * Phase 8.3 — TCPA statutory damage amounts (PRD §11).
 *
 * All money values are integer cents — no floating point.
 */

/** $500 per standard TCPA violation (47 U.S.C. § 227). */
export const TCPA_STATUTORY_STANDARD_CENTS = 50_000;

/** $1,500 per willful TCPA violation. */
export const TCPA_STATUTORY_WILLFUL_CENTS = 150_000;

/** Conservative low: $500 × 1 proven violation. */
export const VALUATION_CONSERVATIVE_LOW_VIOLATIONS = 1;

/** Conservative high: $500 × 2 proven violations. */
export const VALUATION_CONSERVATIVE_HIGH_VIOLATIONS = 2;
