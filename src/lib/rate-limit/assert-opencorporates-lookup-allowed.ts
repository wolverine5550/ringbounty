/**
 * Phase 6.5.5 — Per anonymous-session OpenCorporates lookup budget.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { OPENCORPORATES_RATE_LIMIT_USER_MESSAGE } from "@/lib/constants/registered-agent-lookup";
import type { Database } from "@/types/database";

import {
  OPENCORPORATES_LOOKUP_LIMIT_PER_SESSION,
  OPENCORPORATES_LOOKUP_WINDOW_SECONDS,
  RATE_LIMIT_ACTION_OPENCORPORATES_LOOKUP,
  RATE_LIMIT_SCOPE_ANONYMOUS_SESSION,
} from "./constants";
import { consumeRateLimit } from "./consume-rate-limit";
import { logRateLimitIncident } from "./log-rate-limit-incident";

export class OpenCorporatesRateLimitExceededError extends Error {
  readonly retryAfterSeconds: number;
  readonly userMessage: string;

  constructor(
    retryAfterSeconds: number,
    userMessage = OPENCORPORATES_RATE_LIMIT_USER_MESSAGE,
  ) {
    super(userMessage);
    this.name = "OpenCorporatesRateLimitExceededError";
    this.retryAfterSeconds = retryAfterSeconds;
    this.userMessage = userMessage;
  }
}

export type AssertOpenCorporatesLookupResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number; userMessage: string };

/**
 * Consumes one OpenCorporates lookup unit for the session when `anonymousSessionId` is set.
 * When id is omitted (server tests / logged-in qualify), skips rate limiting.
 */
export async function assertOpenCorporatesLookupAllowed(
  admin: SupabaseClient<Database>,
  anonymousSessionId: string | null | undefined,
): Promise<AssertOpenCorporatesLookupResult> {
  if (!anonymousSessionId?.trim()) {
    return { allowed: true };
  }

  const result = await consumeRateLimit(admin, {
    scope: RATE_LIMIT_SCOPE_ANONYMOUS_SESSION,
    bucketKey: anonymousSessionId,
    action: RATE_LIMIT_ACTION_OPENCORPORATES_LOOKUP,
    maxCount: OPENCORPORATES_LOOKUP_LIMIT_PER_SESSION,
    windowSeconds: OPENCORPORATES_LOOKUP_WINDOW_SECONDS,
  });

  if (!result.allowed) {
    logRateLimitIncident({
      action: RATE_LIMIT_ACTION_OPENCORPORATES_LOOKUP,
      scope: RATE_LIMIT_SCOPE_ANONYMOUS_SESSION,
      bucketKey: anonymousSessionId,
      currentCount: result.currentCount,
      clientIp: "",
      anonymousSessionId,
    });
    return {
      allowed: false,
      retryAfterSeconds: result.retryAfterSeconds,
      userMessage: OPENCORPORATES_RATE_LIMIT_USER_MESSAGE,
    };
  }

  return { allowed: true };
}
