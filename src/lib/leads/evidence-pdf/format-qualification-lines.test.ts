import { describe, expect, it } from "vitest";

import { QUALIFY_SCREEN_1_KEYS } from "@/lib/qualify/screen-1-consent";

import { formatQualificationLines } from "./format-qualification-lines";

describe("formatQualificationLines (§13.2.1)", () => {
  it("formats boolean qualification keys", () => {
    const map = new Map<string, string>([
      [QUALIFY_SCREEN_1_KEYS.gaveDirectConsent, "true"],
    ]);

    const lines = formatQualificationLines(map);
    expect(lines).toContainEqual({
      label: "Gave direct consent to call",
      value: "Yes",
    });
  });
});
