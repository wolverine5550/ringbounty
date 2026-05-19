/**
 * CI-1.3.3 — Optional fail-open fetch to internal worker after enqueue.
 * Cron drain remains source of truth if this fetch drops (timeout, deploy, cold start).
 */

import { resolveSiteOrigin } from "@/lib/stripe/connect/resolve-site-origin";

import type { CompanyIntelligenceEnv } from "./company-intelligence-flags";

const INTERNAL_RUN_PATH = "/api/internal/company-intelligence/run";

/** Site origin for self-fetch (supports `params.env` from check submit). */
function resolveWorkerFetchOrigin(env?: CompanyIntelligenceEnv): string {
  const configured =
    env?.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (env?.VERCEL_URL?.trim()
      ? `https://${env.VERCEL_URL.trim()}`
      : process.env.VERCEL_URL?.trim()
        ? `https://${process.env.VERCEL_URL.trim()}`
        : "");

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return resolveSiteOrigin();
}

export type TriggerCompanyIntelligenceRunFetchParams = {
  runId: string;
  env?: CompanyIntelligenceEnv;
};

/**
 * Fire-and-forget POST to process one run. Never throws; logs on failure only.
 */
export function triggerCompanyIntelligenceRunFetch(
  params: TriggerCompanyIntelligenceRunFetchParams,
): void {
  const cronSecret =
    params.env?.CRON_SECRET?.trim() ?? process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return;
  }

  const url = `${resolveWorkerFetchOrigin(params.env)}${INTERNAL_RUN_PATH}`;

  void fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ run_id: params.runId }),
  }).catch((error: unknown) => {
    console.error(
      JSON.stringify({
        event: "company_intel_trigger_fetch_failed",
        run_id: params.runId,
        message: error instanceof Error ? error.message : "unknown",
      }),
    );
  });
}
