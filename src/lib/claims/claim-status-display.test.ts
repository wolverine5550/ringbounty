import { describe, expect, it } from "vitest";

import {
  getClaimStatusDisplayLabel,
  isClaimPendingQualification,
} from "./claim-status-display";

describe("getClaimStatusDisplayLabel", () => {
  it("maps checking to a user-facing qualify prompt", () => {
    expect(getClaimStatusDisplayLabel("checking")).toBe("Ready to qualify");
  });
});

describe("isClaimPendingQualification", () => {
  it("includes draft and checking", () => {
    expect(isClaimPendingQualification("draft")).toBe(true);
    expect(isClaimPendingQualification("checking")).toBe(true);
    expect(isClaimPendingQualification("qualified")).toBe(false);
  });
});
