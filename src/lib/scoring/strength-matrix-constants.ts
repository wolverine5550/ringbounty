/**
 * Phase 8.1.1 — PRD §8 claim-strength matrix point values and score thresholds.
 */

/** PRD §8 — high-confidence spam database hit (>80). */
export const STRENGTH_MATRIX_SPAM_DB_HIGH_POINTS = 30;

/** PRD §8 — low-confidence spam database hit (<80). */
export const STRENGTH_MATRIX_SPAM_DB_LOW_POINTS = 15;

/** PRD §8 — Federal DNC registered and eligible (31+ days). */
export const STRENGTH_MATRIX_FEDERAL_DNC_ELIGIBLE_POINTS = 25;

/** PRD §8 — State DNC registered. */
export const STRENGTH_MATRIX_STATE_DNC_REGISTERED_POINTS = 10;

/** PRD §8 — Stop request made and ignored (willful). */
export const STRENGTH_MATRIX_WILLFUL_STOP_IGNORED_POINTS = 30;

/** PRD §8 — Calls after 9pm or before 8am. */
export const STRENGTH_MATRIX_TIME_OF_DAY_POINTS = 20;

/** PRD §8 — Multiple calls showing pattern (5+). */
export const STRENGTH_MATRIX_CALL_PATTERN_POINTS = 15;

/** PRD §8 — Company identified. */
export const STRENGTH_MATRIX_COMPANY_IDENTIFIED_POINTS = 10;

/** PRD §8 — Registered agent found. */
export const STRENGTH_MATRIX_REGISTERED_AGENT_POINTS = 5;

/** PRD §8 — Within federal statute of limitations. */
export const STRENGTH_MATRIX_WITHIN_FEDERAL_SOL_POINTS = 10;

/** PRD §8 — User gave direct consent. */
export const STRENGTH_MATRIX_DIRECT_CONSENT_POINTS = -50;

/** PRD §8 — Existing business relationship. */
export const STRENGTH_MATRIX_EXISTING_RELATIONSHIP_POINTS = -20;

/** PRD §8 — Third-party consent possible. */
export const STRENGTH_MATRIX_THIRD_PARTY_CONSENT_POINTS = -15;

/** PRD §8 — Exempt call category (forces ineligible). */
export const STRENGTH_MATRIX_EXEMPT_POINTS = -100;

/** PRD §8 — Outside federal and state SOL. */
export const STRENGTH_MATRIX_OUTSIDE_SOL_POINTS = -30;

/** PRD §8 — Company unidentified. */
export const STRENGTH_MATRIX_COMPANY_UNIDENTIFIED_POINTS = -20;

/** PRD §8 — Single call only. */
export const STRENGTH_MATRIX_SINGLE_CALL_POINTS = -20;

/** PRD §8 — `call_count_total` bucket lower bound for “5+ calls” pattern. */
export const STRENGTH_MATRIX_CALL_PATTERN_MIN_TOTAL = 5;

/** PRD §8 strength thresholds (inclusive lower bound). */
export const STRENGTH_MATRIX_THRESHOLD_STRONG = 70;
export const STRENGTH_MATRIX_THRESHOLD_MODERATE = 40;
export const STRENGTH_MATRIX_THRESHOLD_WEAK = 10;
