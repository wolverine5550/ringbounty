import { describe, expect, it } from "vitest";

import { isPublicMarketingPath } from "./public-routes";

describe("isPublicMarketingPath", () => {
  it("allows home and Phase 3 marketing routes", () => {
    expect(isPublicMarketingPath("/")).toBe(true);
    expect(isPublicMarketingPath("/how-it-works")).toBe(true);
    expect(isPublicMarketingPath("/faq")).toBe(true);
    expect(isPublicMarketingPath("/privacy")).toBe(true);
    expect(isPublicMarketingPath("/terms")).toBe(true);
  });

  it("denies protected app routes", () => {
    expect(isPublicMarketingPath("/check")).toBe(false);
    expect(isPublicMarketingPath("/protected")).toBe(false);
    expect(isPublicMarketingPath("/results")).toBe(false);
  });
});
