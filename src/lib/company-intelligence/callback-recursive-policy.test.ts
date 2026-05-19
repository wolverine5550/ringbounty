import { describe, expect, it } from "vitest";

import {
  MAX_CALLBACK_RECURSIVE_LOOKUPS,
  pickCallbackNumbersForRecursiveLookup,
} from "./callback-recursive-policy";

describe("pickCallbackNumbersForRecursiveLookup (CI-6.1.4)", () => {
  it("dedupes, drops parent phone, and caps at two", () => {
    const picked = pickCallbackNumbersForRecursiveLookup({
      callbackNumbers: [
        "+18005551234",
        "+18005559999",
        "+18005558888",
        "+18005557777",
      ],
      parentPhoneNormalized: "+18005551234",
    });
    expect(picked).toEqual(["+18005559999", "+18005558888"]);
    expect(picked.length).toBe(MAX_CALLBACK_RECURSIVE_LOOKUPS);
  });

  it("normalizes display-format numbers to E.164", () => {
    const picked = pickCallbackNumbersForRecursiveLookup({
      callbackNumbers: ["800-555-9999"],
      parentPhoneNormalized: "+18005551234",
    });
    expect(picked).toEqual(["+18005559999"]);
  });
});
