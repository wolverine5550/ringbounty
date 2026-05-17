import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import { declineFirmLead } from "./decline-firm-lead";

describe("declineFirmLead (§13.5.3)", () => {
  it("inserts firm_lead_declines for pool lead", async () => {
    const supabase = createMockSupabaseClient();
    let call = 0;

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      call += 1;
      if (call === 1 && table === "leads") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: "lead-1" }, error: null }),
        } as never;
      }
      if (table === "firm_lead_declines") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        } as never;
      }
      throw new Error(`unexpected table ${table}`);
    }) as typeof supabase.from);

    const result = await declineFirmLead(supabase, {
      firmId: "firm-1",
      leadId: "lead-1",
      reason: "Not a fit",
    });

    expect(result).toEqual({ declined: true });
  });
});
