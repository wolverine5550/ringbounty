import { describe, expect, it } from "vitest";

import {
  isLegacyPostLoginPath,
  POST_LOGIN_DASHBOARD_PATH,
  resolvePostLoginRedirectPath,
} from "./post-login-redirect";

describe("resolvePostLoginRedirectPath", () => {
  it("sends signed-in users to the dashboard", async () => {
    await expect(
      resolvePostLoginRedirectPath({} as never, "user-1"),
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
