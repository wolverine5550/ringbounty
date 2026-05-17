import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import { finalizeLeadAcceptPayment } from "./finalize-lead-accept-payment";

describe("finalizeLeadAcceptPayment (§13.5.2)", () => {
  it("sets accepted status and timestamps", async () => {
    const admin = createMockSupabaseClient();
    let call = 0;

    vi.mocked(admin.from).mockImplementation(((table: string) => {
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
              status: "reviewed",
              assigned_firm_id: "firm-1",
            },
            error: null,
          }),
        } as never;
      }
      return {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "lead-1" },
          error: null,
        }),
      } as never;
    }) as typeof admin.from);

    const result = await finalizeLeadAcceptPayment(admin, {
      leadId: "lead-1",
      firmId: "firm-1",
      stripePaymentIntentId: "pi_123",
    });

    expect(result).toEqual({ status: "accepted", leadId: "lead-1" });
  });
});
