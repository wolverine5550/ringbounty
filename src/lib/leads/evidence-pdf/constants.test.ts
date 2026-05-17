import { describe, expect, it } from "vitest";

import {
  buildLeadEvidencePdfStoragePath,
  formatLeadEvidencePdfUrlRef,
  parseLeadEvidencePdfUrlRef,
} from "./constants";

describe("evidence-pdf constants (§13.2.2)", () => {
  it("round-trips storage URL ref", () => {
    const path = buildLeadEvidencePdfStoragePath("lead-abc");
    expect(path).toBe("lead-abc/evidence-package.pdf");

    const ref = formatLeadEvidencePdfUrlRef("lead-packages", path);
    expect(parseLeadEvidencePdfUrlRef(ref)).toEqual({
      bucket: "lead-packages",
      objectPath: path,
    });
  });
});
