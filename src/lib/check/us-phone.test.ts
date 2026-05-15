import { describe, expect, it } from "vitest";

import { CHECK_MAX_PHONE_ROWS } from "./constants";
import {
  extractUsPhoneDigits,
  formatUsPhoneMask,
  normalizeNanp10Key,
  normalizeUsPhoneToE164,
  parseAndDedupePhoneNumberPayload,
} from "./us-phone";

describe("extractUsPhoneDigits", () => {
  it("strips non-digits", () => {
    expect(extractUsPhoneDigits("(212) 555-0199")).toBe("2125550199");
  });
});

describe("normalizeNanp10Key", () => {
  it("accepts 10-digit national numbers (length-only; may fail NANP rules)", () => {
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

describe("normalizeUsPhoneToE164", () => {
  it("returns +1 plus 10 digits for valid NANP numbers", () => {
    expect(normalizeUsPhoneToE164("2125550199")).toBe("+12125550199");
    expect(normalizeUsPhoneToE164("(415) 555-8812")).toBe("+14155558812");
  });

  it("accepts leading US country code 1", () => {
    expect(normalizeUsPhoneToE164("+1 (212) 555-0199")).toBe("+12125550199");
    expect(normalizeUsPhoneToE164("12125550199")).toBe("+12125550199");
  });

  it("rejects invalid lengths", () => {
    expect(normalizeUsPhoneToE164("")).toBeNull();
    expect(normalizeUsPhoneToE164("212555019")).toBeNull();
    expect(normalizeUsPhoneToE164("412555019901")).toBeNull();
  });

  it("rejects numbers that violate NANP first-digit rules", () => {
    expect(normalizeUsPhoneToE164("5551234567")).toBeNull();
    expect(normalizeUsPhoneToE164("(555) 123-4567")).toBeNull();
    expect(normalizeUsPhoneToE164("1115550199")).toBeNull();
  });
});

describe("formatUsPhoneMask", () => {
  it("formats progressively", () => {
    expect(formatUsPhoneMask("2")).toBe("(2");
    expect(formatUsPhoneMask("21255")).toBe("(212) 55");
    expect(formatUsPhoneMask("2125550199")).toBe("(212) 555-0199");
  });
});

describe("parseAndDedupePhoneNumberPayload", () => {
  it("dedupes and validates", () => {
    const r = parseAndDedupePhoneNumberPayload(
      ["2125550199", "+1 212 555 0199", "4155558812"],
      CHECK_MAX_PHONE_ROWS,
    );
    expect(r.ok).toBe(false);
    if (r.ok) {
      throw new Error("expected duplicates");
    }
    expect(r.error).toBe("duplicates");
  });

  it("rejects non-arrays and bad entries", () => {
    expect(parseAndDedupePhoneNumberPayload(null, CHECK_MAX_PHONE_ROWS).ok).toBe(
      false,
    );
    expect(
      parseAndDedupePhoneNumberPayload(["2125550199", "bad"], CHECK_MAX_PHONE_ROWS)
        .ok,
    ).toBe(false);
    expect(normalizeNanp10Key("5551234567")).not.toBeNull();
    expect(parseAndDedupePhoneNumberPayload(["5551234567"], CHECK_MAX_PHONE_ROWS)).toEqual({
      ok: false,
      error: "invalid_entry",
    });
  });

  it("accepts unique E.164-normalized rows with optional aligned displays", () => {
    const r = parseAndDedupePhoneNumberPayload(
      ["(212) 555-0199", "4155558812"],
      CHECK_MAX_PHONE_ROWS,
      ["(212) 555-0199", null],
    );
    expect(r).toEqual({
      ok: true,
      entries: [
        {
          phoneNumberNormalized: "+12125550199",
          phoneNumberDisplay: "(212) 555-0199",
        },
        {
          phoneNumberNormalized: "+14155558812",
          phoneNumberDisplay: null,
        },
      ],
    });
  });

  it("requires phone_displays to align with phone_numbers when provided", () => {
    expect(
      parseAndDedupePhoneNumberPayload(["2125550199"], CHECK_MAX_PHONE_ROWS, []).ok,
    ).toBe(false);
    expect(
      parseAndDedupePhoneNumberPayload(
        ["2125550199"],
        CHECK_MAX_PHONE_ROWS,
        [""],
      ),
    ).toEqual({
      ok: true,
      entries: [
        {
          phoneNumberNormalized: "+12125550199",
          phoneNumberDisplay: null,
        },
      ],
    });
  });

  it("rejects malformed display entries", () => {
    const r = parseAndDedupePhoneNumberPayload(
      ["2125550199"],
      CHECK_MAX_PHONE_ROWS,
      [123 as unknown as string],
    );
    expect(r.ok).toBe(false);
    if (r.ok) {
      throw new Error("expect fail");
    }
    expect(r.error).toBe("invalid_display_entry");
  });
});
