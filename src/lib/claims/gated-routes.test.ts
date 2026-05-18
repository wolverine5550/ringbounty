import { describe, expect, it } from "vitest";

import {
  buildAccountRequiredHref,
  buildLoginHrefForClaim,
  isPostCheckGatedRoute,
  sanitizeLoginNextPath,
  sanitizePostCheckReturnPath,
} from "./gated-routes";

describe("gated-routes", () => {
  it("detects post-check gated paths", () => {
    expect(isPostCheckGatedRoute("/results")).toBe(true);
    expect(isPostCheckGatedRoute("/summary")).toBe(true);
    expect(isPostCheckGatedRoute("/qualify/abc")).toBe(true);
    expect(isPostCheckGatedRoute("/letter/preview")).toBe(false);
    expect(isPostCheckGatedRoute("/check")).toBe(false);
    expect(isPostCheckGatedRoute("/login")).toBe(false);
  });

  it("sanitizes login next paths", () => {
    expect(sanitizeLoginNextPath("/results?claim=abc")).toBe(
      "/results?claim=abc",
    );
    expect(sanitizeLoginNextPath("/protected")).toBe("/protected");
    expect(sanitizeLoginNextPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeLoginNextPath("https://evil.test")).toBe("/check");
  });

  it("sanitizes return paths against open redirects", () => {
    expect(sanitizePostCheckReturnPath("/results")).toBe("/results");
    expect(sanitizePostCheckReturnPath("https://evil.test")).toBe("/results");
    expect(sanitizePostCheckReturnPath("//evil")).toBe("/results");
    expect(sanitizePostCheckReturnPath("/check")).toBe("/results");
  });

  it("builds login href with claim id only (no PII)", () => {
    const href = buildLoginHrefForClaim({
      returnPath: "/results",
      claimId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
    });
    expect(href).toMatch(/^\/login\?next=/);
    expect(href).toContain(encodeURIComponent("claim=aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee"));
    expect(href).not.toContain("@");
  });

  it("builds account-required href", () => {
    const href = buildAccountRequiredHref({
      claimId: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
      returnTo: "/summary",
    });
    expect(href).toContain("/check/account-required");
    expect(href).toContain("claim=aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee");
    expect(href).toContain("returnTo=%2Fsummary");
  });
});
