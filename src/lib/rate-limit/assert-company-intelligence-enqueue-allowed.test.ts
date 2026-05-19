import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";
import type { Database } from "@/types/database";

import {
  assertCompanyIntelligenceEnqueueAllowed,
} from "./assert-company-intelligence-enqueue-allowed";
import {
  COMPANY_INTEL_ENQUEUE_LIMIT_PER_IP,
  COMPANY_INTEL_ENQUEUE_LIMIT_PER_SESSION,
  RATE_LIMIT_ACTION_COMPANY_INTELLIGENCE_ENQUEUE,
  RATE_LIMIT_SCOPE_ANONYMOUS_SESSION,
  RATE_LIMIT_SCOPE_IP,
} from "./constants";

function adminWithRpc(): SupabaseClient<Database> {
  const admin = createMockSupabaseClient();
  const rpc = vi.fn();
  return Object.assign(admin, { rpc }) as SupabaseClient<Database>;
}

function mockConsumeRateLimitRpc(
  admin: SupabaseClient<Database>,
  data: { allowed: boolean; current_count: number; retry_after_seconds: number },
): void {
  vi.mocked(admin.rpc).mockResolvedValue({
    data,
    error: null,
    count: null,
    status: 200,
    statusText: "OK",
    success: true,
  } as Awaited<ReturnType<typeof admin.rpc>>);
}

describe("assertCompanyIntelligenceEnqueueAllowed (CI-1.4)", () => {
  it("allows when all buckets have capacity", async () => {
    const admin = adminWithRpc();
    mockConsumeRateLimitRpc(admin, {
      allowed: true,
      current_count: 1,
      retry_after_seconds: 0,
    });

    const result = await assertCompanyIntelligenceEnqueueAllowed(admin, {
      anonymousSessionId: "sid-1",
      clientIp: "203.0.113.1",
    });

    expect(result).toEqual({ allowed: true });
    expect(admin.rpc).toHaveBeenCalledTimes(2);
    expect(admin.rpc).toHaveBeenCalledWith(
      "consume_rate_limit",
      expect.objectContaining({
        p_action: RATE_LIMIT_ACTION_COMPANY_INTELLIGENCE_ENQUEUE,
        p_scope: RATE_LIMIT_SCOPE_ANONYMOUS_SESSION,
        p_bucket_key: "sid-1",
        p_max_count: COMPANY_INTEL_ENQUEUE_LIMIT_PER_SESSION,
      }),
    );
    expect(admin.rpc).toHaveBeenCalledWith(
      "consume_rate_limit",
      expect.objectContaining({
        p_scope: RATE_LIMIT_SCOPE_IP,
        p_bucket_key: "203.0.113.1",
        p_max_count: COMPANY_INTEL_ENQUEUE_LIMIT_PER_IP,
      }),
    );
  });

  it("denies and logs when session bucket exceeded", async () => {
    const admin = adminWithRpc();
    mockConsumeRateLimitRpc(admin, {
      allowed: false,
      current_count: 11,
      retry_after_seconds: 600,
    });
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await assertCompanyIntelligenceEnqueueAllowed(admin, {
      anonymousSessionId: "sid-1",
      clientIp: "203.0.113.1",
    });

    expect(result).toEqual({ allowed: false, retryAfterSeconds: 600 });
    expect(logSpy).toHaveBeenCalled();
    expect(admin.rpc).toHaveBeenCalledTimes(1);
    logSpy.mockRestore();
  });

  it("checks IP only when anonymous session omitted (authenticated path)", async () => {
    const admin = adminWithRpc();
    mockConsumeRateLimitRpc(admin, {
      allowed: true,
      current_count: 1,
      retry_after_seconds: 0,
    });

    await assertCompanyIntelligenceEnqueueAllowed(admin, {
      anonymousSessionId: null,
      clientIp: "203.0.113.9",
    });

    expect(admin.rpc).toHaveBeenCalledTimes(1);
    expect(admin.rpc).toHaveBeenCalledWith(
      "consume_rate_limit",
      expect.objectContaining({
        p_scope: RATE_LIMIT_SCOPE_IP,
        p_bucket_key: "203.0.113.9",
      }),
    );
  });
});
