import { describe, expect, it } from "vitest";

import { CHECK_MAX_PHONE_ROWS } from "./constants";
import {
  extractUsPhoneDigits,
  formatUsPhoneMask,
  normalizeNanp10Key,
  parseAndDedupePhoneNumberPayload,
} from "./us-phone";

describe("extractUsPhoneDigits", () => {
  it("strips non-digits", () => {
    expect(extractUsPhoneDigits("(555) 123-4567")).toBe("5551234567");
  });
});

describe("normalizeNanp10Key", () => {
  it("accepts 10-digit national numbers", () => {
    expect(normalizeNanp10Key("5551234567")).toBe("5551234567");
    expect(normalizeNanp10Key("(555) 123-4567")).toBe("5551234567");
  });

  it("strips leading 1 for 11-digit input", () => {
    expect(normalizeNanp10Key("15551234567")).toBe("5551234567");
    expect(normalizeNanp10Key("+1 (555) 123-4567")).toBe("5551234567");
  });

  it("returns null for incomplete or wrong lengths", () => {
    expect(normalizeNanp10Key("555123456")).toBeNull();
    expect(normalizeNanp10Key("555123456789")).toBeNull();
    expect(normalizeNanp10Key("")).toBeNull();
  });
});

describe("formatUsPhoneMask", () => {
  it("formats progressively", () => {
    expect(formatUsPhoneMask("5")).toBe("(5");
    expect(formatUsPhoneMask("55512")).toBe("(555) 12");
    expect(formatUsPhoneMask("5551234567")).toBe("(555) 123-4567");
  });
});

describe("parseAndDedupePhoneNumberPayload", () => {
  it("dedupes and validates", () => {
    const r = parseAndDedupePhoneNumberPayload(
      ["5551234567", "+1 555-123-4567", "5559876543"],
      CHECK_MAX_PHONE_ROWS,
    );
    expect(r.ok).toBe(false);
    if (r.ok) {
      return new Error("expected duplicates");
    }
    expect(r.error).toBe("duplicates");
  });

  it("rejects non-arrays and bad entries", () => {
    expect(
      parseAndDedupePhoneNumberPayload(null, CHECK_MAX_PHONE_ROWS).ok,
    ).toBe(false);
    expect(
      parseAndDedupePhoneNumberPayload(
        ["5551234567", "bad"],
        CHECK_MAX_PHONE_ROWS,
      ).ok,
    ).toBe(false);
  });

  it("accepts unique normalized list", () => {
    const r = parseAndDedupePhoneNumberPayload(
      ["(555) 111-2233", "5554445566"],
      CHECK_MAX_PHONE_ROWS,
    );
    expect(r).toEqual({
      ok: true,
      normalized: ["5551112233", "5554445566"],
    });
  });
});
