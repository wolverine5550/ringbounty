/**
 * CI-1.1 — Whether to enqueue a Lane B `company_intelligence_runs` row after Lane A persist.
 */

export type ShouldEnqueueCompanyIntelligenceRunParams = {
  /** `COMPANY_INTELLIGENCE_AGENT_ENABLED` (CI-1.1.4). */
  agentEnabled: boolean;
  /** After spam merge + optional Whitepages — substantive Nomorobo sets this true (CI-1.1.3). */
  companyIdentified: boolean;
  isExempt: boolean;
};

/** Pure gate before insert; rate limits run in enqueue (**CI-1.4**). */
export function shouldEnqueueCompanyIntelligenceRun(
  params: ShouldEnqueueCompanyIntelligenceRunParams,
): boolean {
  if (!params.agentEnabled) {
    return false;
  }
  if (params.isExempt) {
    return false;
  }
  if (params.companyIdentified) {
    return false;
  }
  return true;
}
