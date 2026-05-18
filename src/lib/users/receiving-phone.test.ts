import { describe, expect, it } from "vitest";

import { parseReceivingPhoneInput } from "./receiving-phone";

describe("parseReceivingPhoneInput", () => {
  it("normalizes a valid NANP number", () => {
    const result = parseReceivingPhoneInput("8155457907");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.normalized).toBe("+18155457907");
      expect(result.value.display).toBe("(815) 545-7907");
    }
  });

  it("rejects incomplete numbers", () => {
    expect(parseReceivingPhoneInput("815545").ok).toBe(false);
  });
});
