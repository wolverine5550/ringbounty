import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import { syncConnectAccountFromStripe } from "./sync-connect-account-from-stripe";

describe("syncConnectAccountFromStripe (§13.3.3)", () => {
  it("updates law_firms when account id matches", async () => {
    const admin = createMockSupabaseClient();
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "firm-1" },
        error: null,
      }),
    };
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };

    let lawFirmsCall = 0;
    vi.mocked(admin.from).mockImplementation(((table: string) => {
      if (table === "law_firms") {
        lawFirmsCall += 1;
        return (lawFirmsCall === 1 ? selectChain : updateChain) as never;
      }
      throw new Error(`unexpected table ${table}`);
    }) as typeof admin.from);

    const account = {
      id: "acct_test",
      charges_enabled: true,
      details_submitted: true,
    } as Stripe.Account;

    const result = await syncConnectAccountFromStripe(admin, account);
    expect(result).toEqual({ updated: true, firmId: "firm-1" });
    expect(updateChain.update).toHaveBeenCalledWith({
      stripe_connect_charges_enabled: true,
      stripe_connect_details_submitted: true,
    });
  });

  it("no-ops when no firm row matches", async () => {
    const admin = createMockSupabaseClient();
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    vi.mocked(admin.from).mockReturnValue(selectChain as never);

    const account = {
      id: "acct_unknown",
      charges_enabled: false,
      details_submitted: false,
    } as Stripe.Account;

    const result = await syncConnectAccountFromStripe(admin, account);
    expect(result).toEqual({ updated: false, firmId: null });
  });
});
