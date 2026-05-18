import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import { updateFirmLeadStatus } from "./update-firm-lead-status";

describe("updateFirmLeadStatus (§13.6.1)", () => {
  it("sets contacted status and contacted_at", async () => {
    const supabase = createMockSupabaseClient();
    let call = 0;

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table !== "leads") {
        throw new Error(`unexpected table ${table}`);
      }
      call += 1;
      if (call === 1) {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: "lead-1",
              status: "accepted",
              assigned_firm_id: "firm-1",
            },
            error: null,
          }),
        } as never;
      }
      return {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "lead-1" },
          error: null,
        }),
      } as never;
    }) as typeof supabase.from);

    const result = await updateFirmLeadStatus(supabase, {
      leadId: "lead-1",
      firmId: "firm-1",
      status: "contacted",
    });

    expect(result).toEqual({ updated: true, status: "contacted" });
  });

  it("rejects invalid transition", async () => {
    const supabase = createMockSupabaseClient();

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table !== "leads") {
        throw new Error(`unexpected table ${table}`);
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "lead-1",
            status: "accepted",
            assigned_firm_id: "firm-1",
          },
          error: null,
        }),
      } as never;
    }) as typeof supabase.from);

    const result = await updateFirmLeadStatus(supabase, {
      leadId: "lead-1",
      firmId: "firm-1",
      status: "retained",
    });

    expect(result).toEqual({ updated: false, reason: "invalid_transition" });
  });
});
