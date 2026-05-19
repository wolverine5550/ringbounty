/**
 * CI-P.6.3 — Company Intelligence worker drain policy.
 *
 * Constants for cron claim, retry backoff, and staleness. **CI-1** worker routes
 * and **CI-0.1** `company_intelligence_runs` columns must align with these values.
 *
 * Claiming pending rows uses Postgres RPC + `FOR UPDATE SKIP LOCKED` (**CI-P.6.1**),
 * not supabase-js filter-only select.
 */

/** Terminal failure after this many failed processing attempts. */
export const COMPANY_INTEL_MAX_ATTEMPTS = 3;

/** Pending rows older than this are marked failed (`stale_pending`). */
export const COMPANY_INTEL_PENDING_MAX_AGE_HOURS = 72;

/** `running` rows without progress longer than this are reset to `pending`. */
export const COMPANY_INTEL_RUNNING_STALE_MINUTES = 15;

/** Default rows claimed per cron tick (RPC allows 1–25). */
export const COMPANY_INTEL_CRON_BATCH_SIZE_DEFAULT = 5;

/** Hard cap enforced in `claim_company_intelligence_runs` RPC. */
export const COMPANY_INTEL_CRON_BATCH_SIZE_MAX = 25;

/** First retry delay after failure (seconds); doubles per attempt. */
export const COMPANY_INTEL_BACKOFF_BASE_SECONDS = 60;

/**
 * Exponential backoff delay before the next `pending` attempt.
 * @param attemptCount - Value after incrementing on failure (1 = first failure).
 */
export function computeRetryDelaySeconds(attemptCount: number): number {
  if (attemptCount < 1) {
    return 0;
  }
  const exponent = attemptCount - 1;
  return COMPANY_INTEL_BACKOFF_BASE_SECONDS * 2 ** exponent;
}

/** Whether the run should move to terminal `failed` (no more retries). */
export function shouldPermanentlyFail(attemptCount: number): boolean {
  return attemptCount >= COMPANY_INTEL_MAX_ATTEMPTS;
}

/** Clamp cron batch size to RPC-valid range. */
export function clampCronBatchSize(requested: number): number {
  if (!Number.isFinite(requested)) {
    return COMPANY_INTEL_CRON_BATCH_SIZE_DEFAULT;
  }
  const n = Math.floor(requested);
  return Math.min(
    COMPANY_INTEL_CRON_BATCH_SIZE_MAX,
    Math.max(1, n),
  );
}
