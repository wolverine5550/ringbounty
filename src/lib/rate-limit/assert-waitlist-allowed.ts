import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import type { Database } from "@/types/database";

import {
  RATE_LIMIT_ACTION_WAITLIST,
  RATE_LIMIT_SCOPE_IP,
  WAITLIST_LIMIT_PER_IP,
  WAITLIST_RATE_LIMIT_USER_MESSAGE,
  WAITLIST_WINDOW_SECONDS,
} from "./constants";
import { consumeRateLimit } from "./consume-rate-limit";
import { getClientIp } from "./get-client-ip";
import { logRateLimitIncident } from "./log-rate-limit-incident";
import { RateLimitExceededError } from "./assert-check-submission-allowed";

/**
 * Rate-limits waitlist signups per IP to reduce abuse (§2.8).
 */
export async function assertWaitlistAllowed(
  admin: SupabaseClient<Database>,
  request: NextRequest,
): Promise<void> {
  const clientIp = getClientIp(request);

  const result = await consumeRateLimit(admin, {
    scope: RATE_LIMIT_SCOPE_IP,
    bucketKey: clientIp,
    action: RATE_LIMIT_ACTION_WAITLIST,
    maxCount: WAITLIST_LIMIT_PER_IP,
    windowSeconds: WAITLIST_WINDOW_SECONDS,
  });

  if (!result.allowed) {
    logRateLimitIncident({
      action: RATE_LIMIT_ACTION_WAITLIST,
      scope: RATE_LIMIT_SCOPE_IP,
      bucketKey: clientIp,
      currentCount: result.currentCount,
      clientIp,
    });
    throw new RateLimitExceededError(
      result.retryAfterSeconds,
      WAITLIST_RATE_LIMIT_USER_MESSAGE,
    );
  }
}
