import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import { persistStateDncLookup } from "./persist-state-dnc-lookup";

describe("persistStateDncLookup (§13.7.2)", () => {
  it("skips DB write when lookup registered is null", async () => {
    const supabase = createMockSupabaseClient();

    const result = await persistStateDncLookup(supabase, {
      claimId: "claim-1",
      claimSubjectId: "subject-1",
      phoneNumberNormalized: "+15551234567",
      stateCode: "CO",
      lookup: { registered: null, checkedAt: null },
    });

    expect(result.persisted).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("updates dnc_check_results when lookup is definitive", async () => {
    const supabase = createMockSupabaseClient();
    let call = 0;

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "dnc_check_results") {
        call += 1;
        if (call === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "dnc-1" },
              error: null,
            }),
          } as never;
        }
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        } as never;
      }
      if (table === "claim_events") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        } as never;
      }
      throw new Error(`unexpected table ${table}`);
    }) as typeof supabase.from);

    const result = await persistStateDncLookup(supabase, {
      claimId: "claim-1",
      claimSubjectId: "subject-1",
      phoneNumberNormalized: "+15551234567",
      stateCode: "CO",
      lookup: {
        registered: true,
        checkedAt: "2026-05-17T12:00:00.000Z",
      },
    });

    expect(result.persisted).toBe(true);
    expect(result.stateDncRegistered).toBe(true);
    expect(result.matrixPoints).toBe(10);
  });
});
