/**
 * CI-8.3 — Check funnel copy/helpers when Lane B is enqueued after submit.
 */

import type { NumberCheckSummary } from "@/lib/check/parallel-check-pipeline-stub";

/** True when at least one number in the submit response started background company research. */
export function hasCompanyIntelEnqueuedOnCheck(
  numberChecks: NumberCheckSummary[],
): boolean {
  return numberChecks.some((row) => row.company_intel_enqueued === true);
}
