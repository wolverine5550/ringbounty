import { describe, expect, it } from "vitest";

import { PRODUCT_DISCLAIMER } from "./constants";

describe("PRODUCT_DISCLAIMER", () => {
  it("matches PRD §3 exact disclaimer string", () => {
    expect(PRODUCT_DISCLAIMER).toBe(
      "RingBounty is not a law firm and does not provide legal advice. Information provided is for general informational purposes only. Estimated values are based on statutory amounts and are not guarantees of any outcome. For advice about your specific situation, consult a licensed attorney.",
    );
  });

  it("does not offer legal advice — only states we do not provide it (§3.6.3)", () => {
    expect(PRODUCT_DISCLAIMER.toLowerCase()).toContain(
      "does not provide legal advice",
    );
    expect(PRODUCT_DISCLAIMER.toLowerCase()).not.toMatch(
      /\bwe provide legal advice\b/,
    );
  });
});
