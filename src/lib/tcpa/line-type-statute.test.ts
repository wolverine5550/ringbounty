import { describe, expect, it } from "vitest";

import {
  isLineType,
  mapLineTypeToTcpaSubsection,
  TCPA_STATUTE_MOBILE,
  TCPA_STATUTE_RESIDENTIAL,
} from "./line-type-statute";

describe("line-type-statute (§7.6.3)", () => {
  it("accepts mobile and residential", () => {
    expect(isLineType("mobile")).toBe(true);
    expect(isLineType("residential")).toBe(true);
    expect(isLineType("voip")).toBe(false);
  });

  it("maps mobile to §227(b)(1)(A)(iii)", () => {
    expect(mapLineTypeToTcpaSubsection("mobile")).toEqual({
      cite: TCPA_STATUTE_MOBILE,
      token: "227b_1_A_iii",
    });
  });

  it("maps residential to §227(b)(1)(B)", () => {
    expect(mapLineTypeToTcpaSubsection("residential")).toEqual({
      cite: TCPA_STATUTE_RESIDENTIAL,
      token: "227b_1_B",
    });
  });
});
