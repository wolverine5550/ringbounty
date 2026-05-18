import { describe, expect, it, vi } from "vitest";

import {
  isLegacyPostLoginPath,
  POST_LOGIN_CHECK_PATH,
  POST_LOGIN_DASHBOARD_PATH,
  resolvePostLoginRedirectPath,
} from "./post-login-redirect";

describe("resolvePostLoginRedirectPath", () => {
  it("sends users without screened subjects to /check", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [{ id: "c1", claim_subjects: [] }],
              error: null,
            }),
          }),
        }),
      }),
    };

    await expect(
      resolvePostLoginRedirectPath(supabase as never, "user-1"),
    ).resolves.toBe(POST_LOGIN_CHECK_PATH);
  });

  it("sends users with at least one subject to /dashboard", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { id: "c1", claim_subjects: [] },
                { id: "c2", claim_subjects: [{ id: "s1" }] },
              ],
              error: null,
            }),
          }),
        }),
      }),
    };

    await expect(
      resolvePostLoginRedirectPath(supabase as never, "user-1"),
    ).resolves.toBe(POST_LOGIN_DASHBOARD_PATH);
  });
});

describe("isLegacyPostLoginPath", () => {
  it("detects starter /protected paths", () => {
    expect(isLegacyPostLoginPath("/protected")).toBe(true);
    expect(isLegacyPostLoginPath("/protected/foo")).toBe(true);
    expect(isLegacyPostLoginPath("/dashboard")).toBe(false);
  });
});
