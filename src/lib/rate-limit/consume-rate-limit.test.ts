import { describe, expect, it, vi } from "vitest";

import { consumeRateLimit } from "./consume-rate-limit";

describe("consumeRateLimit", () => {
  it("parses allowed RPC response", async () => {
    const admin = {
      rpc: vi.fn().mockResolvedValue({
        data: {
          allowed: true,
          current_count: 2,
          retry_after_seconds: 1800,
        },
        error: null,
      }),
    };

    const result = await consumeRateLimit(admin as never, {
      scope: "ip",
      bucketKey: "1.2.3.4",
      action: "check_submission",
      maxCount: 10,
    });

    expect(result).toEqual({
      allowed: true,
      currentCount: 2,
      retryAfterSeconds: 1800,
    });
  });

  it("parses denied RPC response", async () => {
    const admin = {
      rpc: vi.fn().mockResolvedValue({
        data: {
          allowed: false,
          current_count: 11,
          retry_after_seconds: 900,
        },
        error: null,
      }),
    };

    const result = await consumeRateLimit(admin as never, {
      scope: "anonymous_session",
      bucketKey: "session-uuid",
      action: "check_submission",
      maxCount: 10,
    });

    expect(result.allowed).toBe(false);
    expect(result.currentCount).toBe(11);
  });
});
