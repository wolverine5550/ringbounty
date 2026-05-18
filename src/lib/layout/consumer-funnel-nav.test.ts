import { describe, expect, it } from "vitest";

import { POST_LOGIN_DASHBOARD_PATH } from "@/lib/claims/post-login-redirect";

import {
  CONSUMER_FUNNEL_NAV_LINKS,
  getConsumerFunnelNavLinksForPath,
} from "./consumer-funnel-nav";

describe("CONSUMER_FUNNEL_NAV_LINKS", () => {
  it("includes dashboard only (inline check on dashboard)", () => {
    const hrefs = CONSUMER_FUNNEL_NAV_LINKS.map((l) => l.href);
    expect(hrefs).toEqual([POST_LOGIN_DASHBOARD_PATH]);
    expect(hrefs).not.toContain("/check");
  });
});

describe("getConsumerFunnelNavLinksForPath", () => {
  it("hides Dashboard on /dashboard", () => {
    const hrefs = getConsumerFunnelNavLinksForPath("/dashboard").map(
      (l) => l.href,
    );
    expect(hrefs).toHaveLength(0);
  });

  it("shows Dashboard on check, qualify, and results", () => {
    for (const path of ["/check", "/results", "/qualify/abc-123"]) {
      const hrefs = getConsumerFunnelNavLinksForPath(path).map((l) => l.href);
      expect(hrefs).toEqual([POST_LOGIN_DASHBOARD_PATH]);
    }
  });
});
