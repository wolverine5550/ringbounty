import { describe, expect, it } from "vitest";

import { parsePositiveCallCount } from "./screen-3-call-details";

describe("screen-3-call-details (§7.4)", () => {
  it("accepts positive call counts", () => {
    expect(parsePositiveCallCount(14, "call_count_after_stop")).toBe(14);
    expect(parsePositiveCallCount("6", "calls_after_9pm_count")).toBe(6);
  });

  it("rejects zero and non-integers", () => {
    expect(parsePositiveCallCount(0, "calls_after_9pm_count")).toEqual({
      error: "calls_after_9pm_count must be an integer from 1 to 9999",
    });
    expect(parsePositiveCallCount("abc", "call_count_after_stop")).toEqual({
      error: "call_count_after_stop must be an integer from 1 to 9999",
    });
  });
});
