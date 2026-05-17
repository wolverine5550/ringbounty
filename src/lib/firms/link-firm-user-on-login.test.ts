import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import { linkFirmUserOnLogin } from "./link-firm-user-on-login";

describe("linkFirmUserOnLogin (§13.4.2)", () => {
  it("links auth_user_id when row exists and is unlinked", async () => {
    const admin = createMockSupabaseClient();
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "fu-1",
          firm_id: "firm-1",
          auth_user_id: null,
          email: "lawyer@firm.com",
        },
        error: null,
      }),
    };
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockResolvedValue({ error: null }),
    };

    let call = 0;
    vi.mocked(admin.from).mockImplementation(((table: string) => {
      if (table === "firm_users") {
        call += 1;
        return (call === 1 ? selectChain : updateChain) as never;
      }
      throw new Error(`unexpected table ${table}`);
    }) as typeof admin.from);

    const result = await linkFirmUserOnLogin(admin, {
      authUserId: "auth-1",
      email: "lawyer@firm.com",
    });

    expect(result).toEqual({
      linked: true,
      firmUserId: "fu-1",
      firmId: "firm-1",
    });
    expect(updateChain.update).toHaveBeenCalledWith({ auth_user_id: "auth-1" });
  });

  it("no-ops when no firm_users row matches", async () => {
    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as never);

    const result = await linkFirmUserOnLogin(admin, {
      authUserId: "auth-1",
      email: "unknown@firm.com",
    });

    expect(result).toEqual({ linked: false, reason: "no_matching_row" });
  });
});
