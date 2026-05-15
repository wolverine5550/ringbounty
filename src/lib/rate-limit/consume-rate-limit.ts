import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type ConsumeRateLimitResult = {
  allowed: boolean;
  currentCount: number;
  retryAfterSeconds: number;
};

function parseRpcResult(raw: unknown): ConsumeRateLimitResult {
  const obj = raw as Record<string, unknown> | null;
  if (!obj || typeof obj !== "object") {
    throw new Error("Invalid consume_rate_limit response");
  }

  return {
    allowed: Boolean(obj.allowed),
    currentCount: Number(obj.current_count ?? 0),
    retryAfterSeconds: Number(obj.retry_after_seconds ?? 0),
  };
}

/**
 * Atomically increments a rate-limit bucket via `public.consume_rate_limit` (§2.7).
 */
export async function consumeRateLimit(
  admin: SupabaseClient<Database>,
  params: {
    scope: string;
    bucketKey: string;
    action: string;
    maxCount: number;
    windowSeconds?: number;
  },
): Promise<ConsumeRateLimitResult> {
  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_scope: params.scope,
    p_bucket_key: params.bucketKey,
    p_action: params.action,
    p_max_count: params.maxCount,
    p_window_secs: params.windowSeconds ?? 3600,
  });

  if (error) {
    throw error;
  }

  return parseRpcResult(data);
}
