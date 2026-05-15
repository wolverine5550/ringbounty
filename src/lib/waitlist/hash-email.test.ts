import { describe, expect, it } from "vitest";

import { hashEmail, normalizeEmail } from "./hash-email";

describe("hashEmail", () => {
  it("normalizes case and whitespace before hashing", () => {
    const a = hashEmail(normalizeEmail("  Test@Mail.COM "));
    const b = hashEmail(normalizeEmail("test@mail.com"));
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});
