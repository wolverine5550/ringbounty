import { describe, expect, it } from "vitest";

import {
  FIRM_PORTAL_HOME_PATH,
  isFirmPortalHostname,
  isFirmPortalPath,
  isFirmPortalPublicPath,
} from "./firm-portal-host";

describe("firm-portal-host (§13.4.1)", () => {
  it("detects firms.* hostnames", () => {
    expect(isFirmPortalHostname("firms.ringbounty.com")).toBe(true);
    expect(isFirmPortalHostname("firms.localhost:3000")).toBe(true);
    expect(isFirmPortalHostname("www.ringbounty.com")).toBe(false);
  });

  it("detects /firms paths", () => {
    expect(isFirmPortalPath("/firms/leads")).toBe(true);
    expect(isFirmPortalPath("/results")).toBe(false);
  });

  it("marks landing, login, and stripe return paths public", () => {
    expect(isFirmPortalPublicPath("/firms")).toBe(true);
    expect(isFirmPortalPublicPath("/firms/login")).toBe(true);
    expect(
      isFirmPortalPublicPath("/firms/onboarding/stripe/complete"),
    ).toBe(true);
    expect(isFirmPortalPublicPath("/firms/leads")).toBe(false);
  });

  it("exposes home path", () => {
    expect(FIRM_PORTAL_HOME_PATH).toBe("/firms/leads");
  });
});
