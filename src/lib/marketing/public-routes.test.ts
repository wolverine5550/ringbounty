import { describe, expect, it } from "vitest";

import { isPublicMarketingPath } from "./public-routes";

describe("isPublicMarketingPath (§11)", () => {
  it("allows SEO landing pages", () => {
    expect(isPublicMarketingPath("/tcpa-violation-checker")).toBe(true);
    expect(isPublicMarketingPath("/robocall-lawsuit")).toBe(true);
  });

  it("allows company spam-call paths", () => {
    expect(isPublicMarketingPath("/carshield-spam-calls")).toBe(true);
  });

  it("does not treat unrelated slugs as marketing", () => {
    expect(isPublicMarketingPath("/protected")).toBe(false);
  });
});
