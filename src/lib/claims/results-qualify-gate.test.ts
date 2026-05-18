import { describe, expect, it } from "vitest";

import {
  buildResultsQualifyHref,
  isClaimQualifiedForAttorneyPath,
  pickResultsQualifySubjectId,
} from "./results-qualify-gate";

describe("results-qualify-gate", () => {
  it("treats only qualified claims as attorney-ready", () => {
    expect(isClaimQualifiedForAttorneyPath("qualified")).toBe(true);
    expect(isClaimQualifiedForAttorneyPath("checking")).toBe(false);
    expect(isClaimQualifiedForAttorneyPath("draft")).toBe(false);
  });

  it("picks first non-exempt subject for qualify link", () => {
    expect(
      pickResultsQualifySubjectId([
        { subjectId: "exempt-1", isExempt: true },
        { subjectId: "ok-1", isExempt: false },
      ]),
    ).toBe("ok-1");
  });

  it("builds qualify href with claim query", () => {
    expect(
      buildResultsQualifyHref({ claimId: "claim-1", subjectId: "sub-1" }),
    ).toBe("/qualify/sub-1?claim=claim-1");
  });
});
