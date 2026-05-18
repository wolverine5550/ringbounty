import { describe, expect, it } from "vitest";

import { formatQualifyEvaluatedCallerDisplay } from "./constants";

describe("formatQualifyEvaluatedCallerDisplay", () => {
  it("prefers masked display over E.164", () => {
    expect(
      formatQualifyEvaluatedCallerDisplay("(708) 892-8984", "+17088928984"),
    ).toBe("(708) 892-8984");
  });

  it("falls back to normalized when display is missing", () => {
    expect(formatQualifyEvaluatedCallerDisplay(null, "+17088928984")).toBe(
      "+17088928984",
    );
  });
});
