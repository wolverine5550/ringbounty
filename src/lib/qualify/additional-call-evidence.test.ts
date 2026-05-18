import { describe, expect, it } from "vitest";

import {
  parseAdditionalEvidencePathsEventValue,
  validateAdditionalCallEvidenceFile,
} from "./additional-call-evidence";

describe("additional-call-evidence", () => {
  it("accepts images and pdf", () => {
    expect(
      validateAdditionalCallEvidenceFile({
        size: 100,
        type: "image/png",
        name: "screen.png",
      }).ok,
    ).toBe(true);
  });

  it("parses stored path JSON", () => {
    expect(
      parseAdditionalEvidencePathsEventValue(
        JSON.stringify(["user/claim/sub/additional-evidence/a.png"]),
      ),
    ).toHaveLength(1);
  });
});
