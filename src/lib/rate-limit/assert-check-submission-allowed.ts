import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import type { Database } from "@/types/database";

import {
  CHECK_SUBMISSION_LIMIT_PER_IP,
  CHECK_SUBMISSION_LIMIT_PER_SESSION,
  CHECK_SUBMISSION_WINDOW_SECONDS,
  RATE_LIMIT_ACTION_CHECK_SUBMISSION,
  RATE_LIMIT_SCOPE_ANONYMOUS_SESSION,
  RATE_LIMIT_SCOPE_IP,
  RATE_LIMIT_USER_MESSAGE,
} from "./constants";
import { consumeRateLimit } from "./consume-rate-limit";
import { getClientIp } from "./get-client-ip";
import { logRateLimitIncident } from "./log-rate-limit-incident";

export class RateLimitExceededError extends Error {
  readonly retryAfterSeconds: number;
  readonly userMessage: string;

  constructor(retryAfterSeconds: number, userMessage = RATE_LIMIT_USER_MESSAGE) {
    super(userMessage);
    this.name = "RateLimitExceededError";
    this.retryAfterSeconds = retryAfterSeconds;
    this.userMessage = userMessage;
  }
}

/**
 * Enforces hourly check-submission limits per anonymous session and per IP (§2.7.2).
 * Phase 4 phone-check pipeline should call this before running expensive work.
 */
export async function assertCheckSubmissionAllowed(
  admin: SupabaseClient<Database>,
  request: NextRequest,
  anonymousSessionId: string,
): Promise<void> {
  const clientIp = getClientIp(request);

  const checks = [
    {
      scope: RATE_LIMIT_SCOPE_ANONYMOUS_SESSION,
      bucketKey: anonymousSessionId,
      maxCount: CHECK_SUBMISSION_LIMIT_PER_SESSION,
    },
    {
      scope: RATE_LIMIT_SCOPE_IP,
      bucketKey: clientIp,
      maxCount: CHECK_SUBMISSION_LIMIT_PER_IP,
    },
  ] as const;

  for (const check of checks) {
    const result = await consumeRateLimit(admin, {
      scope: check.scope,
      bucketKey: check.bucketKey,
      action: RATE_LIMIT_ACTION_CHECK_SUBMISSION,
      maxCount: check.maxCount,
      windowSeconds: CHECK_SUBMISSION_WINDOW_SECONDS,
    });

    if (!result.allowed) {
      logRateLimitIncident({
        action: RATE_LIMIT_ACTION_CHECK_SUBMISSION,
        scope: check.scope,
        bucketKey: check.bucketKey,
        currentCount: result.currentCount,
        clientIp,
        anonymousSessionId,
      });
      throw new RateLimitExceededError(result.retryAfterSeconds);
    }
  }
}
