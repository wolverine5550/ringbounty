import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import { completeQualifyClaim } from "./complete-qualify-claim";

describe("completeQualifyClaim (§7.7.1)", () => {
  it("updates checking claim to qualified and enqueues scoring markers", async () => {
    const supabase = createMockSupabaseClient();
    const claimsChain = {
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi
        .fn()
        .mockResolvedValueOnce({ data: { status: "checking" }, error: null }),
    };
    const eventsChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi
        .fn()
        .mockResolvedValue({ data: null, error: null }),
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "claims") {
        return claimsChain as never;
      }
      return eventsChain as never;
    });

    claimsChain.update.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    eventsChain.insert.mockResolvedValue({ error: null });

    const result = await completeQualifyClaim(supabase, { claimId: "claim-1" });

    expect(result.statusUpdated).toBe(true);
    expect(result.scoringEnqueued).toBe(true);
    expect(claimsChain.update).toHaveBeenCalledWith({ status: "qualified" });
    expect(eventsChain.insert).toHaveBeenCalled();
  });

  it("skips status update when already qualified", async () => {
    const supabase = createMockSupabaseClient();
    const claimsChain = {
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi
        .fn()
        .mockResolvedValueOnce({ data: { status: "qualified" }, error: null }),
    };
    const eventsChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi
        .fn()
        .mockResolvedValue({ data: { id: "evt-1" }, error: null }),
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "claims") {
        return claimsChain as never;
      }
      return eventsChain as never;
    });

    const result = await completeQualifyClaim(supabase, { claimId: "claim-1" });

    expect(result.statusUpdated).toBe(false);
    expect(result.scoringEnqueued).toBe(false);
    expect(claimsChain.update).not.toHaveBeenCalled();
    expect(eventsChain.insert).not.toHaveBeenCalled();
  });
});
