import { describe, expect, it } from "vitest";
import {
  CALL_CATEGORY_VALUES,
  isCallCategory,
  type CallCategory,
} from "./claimSubject";

describe("claimSubject constants", () => {
  it("lists every CallCategory from the PRD schema comment (prd.md section 5)", () => {
    expect(CALL_CATEGORY_VALUES).toHaveLength(8);
    const set = new Set<string>(CALL_CATEGORY_VALUES);
    expect(set.size).toBe(8);
  });

  it("isCallCategory accepts PRD literals and rejects junk", () => {
    const ok: CallCategory = "telemarketer";
    expect(isCallCategory(ok)).toBe(true);
    expect(isCallCategory("robocall")).toBe(true);
    expect(isCallCategory("")).toBe(false);
    expect(isCallCategory("debt_collector")).toBe(false);
    expect(isCallCategory(null)).toBe(false);
  });
});
