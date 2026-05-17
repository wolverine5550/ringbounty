import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import { persistSolFlags } from "./persist-sol-flags";
import { SOL_CLAIM_EVENT_KEYS, SOL_VALUE_CALCULATED_EVENT } from "./sol-claim-events";

describe("persistSolFlags (§8.2.4)", () => {
  it("inserts value_calculated claim_events for SOL keys", async () => {
    const supabase = createMockSupabaseClient();
    const eventsChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "claim_events") {
        return eventsChain as never;
      }
      return { insert: vi.fn() } as never;
    });

    const result = await persistSolFlags(supabase, {
      claimId: "claim-1",
      mostRecentCallDate: "2020-01-01",
      userState: "CA",
      referenceDate: new Date("2026-05-17T12:00:00.000Z"),
    });

    expect(result?.likelyTimeBarred).toBe(true);
    expect(eventsChain.insert).toHaveBeenCalledTimes(1);

    const rows = eventsChain.insert.mock.calls[0][0] as Array<{
      event_type: string;
      key: string;
      value: string;
    }>;

    expect(rows.every((r) => r.event_type === SOL_VALUE_CALCULATED_EVENT)).toBe(
      true,
    );
    expect(rows.find((r) => r.key === SOL_CLAIM_EVENT_KEYS.likelyTimeBarred)?.value).toBe(
      "true",
    );
    expect(rows.find((r) => r.key === SOL_CLAIM_EVENT_KEYS.withinFederalSol)?.value).toBe(
      "false",
    );
  });
});
