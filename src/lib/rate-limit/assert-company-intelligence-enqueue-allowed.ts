/**
 * CI-1.4.2 — Hourly caps on Lane B enqueue (session + IP). Does not block `/check` response.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import {
  COMPANY_INTEL_ENQUEUE_LIMIT_PER_IP,
  COMPANY_INTEL_ENQUEUE_LIMIT_PER_SESSION,
  COMPANY_INTEL_ENQUEUE_WINDOW_SECONDS,
  RATE_LIMIT_ACTION_COMPANY_INTELLIGENCE_ENQUEUE,
  RATE_LIMIT_SCOPE_ANONYMOUS_SESSION,
  RATE_LIMIT_SCOPE_IP,
} from "./constants";
import { consumeRateLimit } from "./consume-rate-limit";
import { logRateLimitIncident } from "./log-rate-limit-incident";

export type AssertCompanyIntelligenceEnqueueResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export type AssertCompanyIntelligenceEnqueueAllowedParams = {
  anonymousSessionId: string | null | undefined;
  clientIp: string;
};

/**
 * Consumes one enqueue unit per scope when allowed. Authenticated `/check` passes
 * `anonymousSessionId=null` → IP bucket only (same pattern as OpenCorporates).
 */
export async function assertCompanyIntelligenceEnqueueAllowed(
  admin: SupabaseClient<Database>,
  params: AssertCompanyIntelligenceEnqueueAllowedParams,
): Promise<AssertCompanyIntelligenceEnqueueResult> {
  const sessionId = params.anonymousSessionId?.trim();
  const clientIp = params.clientIp?.trim() || "unknown";

  const checks: {
    scope: string;
    bucketKey: string;
    maxCount: number;
  }[] = [];

  if (sessionId) {
    checks.push({
      scope: RATE_LIMIT_SCOPE_ANONYMOUS_SESSION,
      bucketKey: sessionId,
      maxCount: COMPANY_INTEL_ENQUEUE_LIMIT_PER_SESSION,
    });
  }

  checks.push({
    scope: RATE_LIMIT_SCOPE_IP,
    bucketKey: clientIp,
    maxCount: COMPANY_INTEL_ENQUEUE_LIMIT_PER_IP,
  });

  for (const check of checks) {
    const result = await consumeRateLimit(admin, {
      scope: check.scope,
      bucketKey: check.bucketKey,
      action: RATE_LIMIT_ACTION_COMPANY_INTELLIGENCE_ENQUEUE,
      maxCount: check.maxCount,
      windowSeconds: COMPANY_INTEL_ENQUEUE_WINDOW_SECONDS,
    });

    if (!result.allowed) {
      logRateLimitIncident({
        action: RATE_LIMIT_ACTION_COMPANY_INTELLIGENCE_ENQUEUE,
        scope: check.scope,
        bucketKey: check.bucketKey,
        currentCount: result.currentCount,
        clientIp,
        anonymousSessionId: sessionId,
      });
      return {
        allowed: false,
        retryAfterSeconds: result.retryAfterSeconds,
      };
    }
  }

  return { allowed: true };
}
