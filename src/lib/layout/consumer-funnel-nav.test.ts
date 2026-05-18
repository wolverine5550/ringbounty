import { describe, expect, it } from "vitest";

import { RESULTS_PATH } from "@/lib/claims/gated-routes";

import {
  CONSUMER_FUNNEL_NAV_LINKS,
  getConsumerFunnelNavLinksForPath,
} from "./consumer-funnel-nav";

describe("CONSUMER_FUNNEL_NAV_LINKS", () => {
  it("includes check and results paths", () => {
    const hrefs = CONSUMER_FUNNEL_NAV_LINKS.map((l) => l.href);
    expect(hrefs).toContain("/check");
    expect(hrefs).toContain(RESULTS_PATH);
  });
});

describe("getConsumerFunnelNavLinksForPath", () => {
  it("hides Check numbers on /check and /check/*", () => {
    for (const path of ["/check", "/check/account-required"]) {
      const hrefs = getConsumerFunnelNavLinksForPath(path).map((l) => l.href);
      expect(hrefs).not.toContain("/check");
      expect(hrefs).toContain(RESULTS_PATH);
    }
  });

  it("shows Check numbers on qualify and results", () => {
    for (const path of ["/results", "/qualify/abc-123"]) {
      const hrefs = getConsumerFunnelNavLinksForPath(path).map((l) => l.href);
      expect(hrefs).toContain("/check");
    }
  });
});
