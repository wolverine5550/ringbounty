import { describe, expect, it } from "vitest";

import { validateEmail } from "./validate-email";

describe("validateEmail", () => {
  it("accepts a well-formed address", () => {
    expect(validateEmail("  User@Example.com ")).toEqual({
      ok: true,
      email: "User@Example.com",
    });
  });

  it("rejects empty input", () => {
    expect(validateEmail("   ")).toEqual({
      ok: false,
      error: "Email is required.",
    });
  });

  it("rejects malformed addresses", () => {
    expect(validateEmail("not-an-email")).toEqual({
      ok: false,
      error: "Enter a valid email address.",
    });
  });
});
