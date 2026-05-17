import { describe, expect, it } from "vitest";

import { parseQualifyLineType, parseQualifyScreen5Body } from "./screen-5-line-type";

describe("screen-5-line-type (§7.6)", () => {
  it("parses valid line_type values", () => {
    expect(parseQualifyLineType("mobile")).toBe("mobile");
    expect(parseQualifyLineType("residential")).toBe("residential");
  });

  it("rejects invalid line_type", () => {
    expect(parseQualifyLineType("landline")).toEqual({
      error: "line_type must be mobile or residential",
    });
  });

  it("parses screen 5 body", () => {
    expect(parseQualifyScreen5Body({ line_type: "mobile" })).toEqual({
      lineType: "mobile",
    });
  });
});
