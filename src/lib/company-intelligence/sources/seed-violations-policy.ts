/**
 * CI-2.2.2 — Round 1 short-circuit thresholds (FTC seed cache).
 */

/** High-volume FTC complaints → short-circuit Round 1 (Path A/B). */
export const SEED_HIGH_COMPLAINT_COUNT_THRESHOLD = 50;

/** Path A: substantive `reported_company_name` + high count → fixed suggest confidence. */
export const SEED_PATH_A_SHORT_CIRCUIT_CONFIDENCE = 85;
