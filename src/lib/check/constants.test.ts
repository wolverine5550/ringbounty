import { describe, expect, it } from "vitest";

import {
  CHECK_FREE_LOOKUP_MAX_PHONES,
  CHECK_MAX_PHONE_ROWS,
  CHECK_NUMBER_ENTRY_HEADING,
  RB_CHECK_SUBMITTED_EVENT,
} from "./constants";

describe("check flow constants", () => {
  it("defines single-step number entry heading on /check", () => {
    expect(CHECK_NUMBER_ENTRY_HEADING).toBe("Enter a number");
  });

  it("limits anonymous funnel to one phone per free check", () => {
    expect(CHECK_FREE_LOOKUP_MAX_PHONES).toBe(1);
  });

  it("defines phone row cap and submit custom-event name for §4.3", () => {
    expect(CHECK_MAX_PHONE_ROWS).toBe(10);
    expect(RB_CHECK_SUBMITTED_EVENT).toBe("rb-check-submitted");
  });
});
