import { describe, expect, it } from "vitest";

import {
  FEDERAL_DNC_V01_ACCESS_PATH,
  getFederalDncCheckSummaryForClient,
  isFederalDncAutomatedCheckAvailable,
} from "./federal-dnc-access";
import { FEDERAL_DNC_UNAVAILABLE_USER_MESSAGE } from "@/lib/constants/federal-dnc-unavailable";

describe("federal-dnc-access (§6.1)", () => {
  it("disables automated check by default", () => {
    expect(isFederalDncAutomatedCheckAvailable({})).toBe(false);
    expect(
      isFederalDncAutomatedCheckAvailable({
        FEDERAL_DNC_AUTOMATED_ENABLED: "false",
      }),
    ).toBe(false);
  });

  it("allows automated check only when env flag is set", () => {
    expect(
      isFederalDncAutomatedCheckAvailable({
        FEDERAL_DNC_AUTOMATED_ENABLED: "true",
      }),
    ).toBe(true);
  });

  it("returns unavailable summary for v0.1 client payload", () => {
    expect(getFederalDncCheckSummaryForClient({})).toEqual({
      status: "unavailable",
      automated_check_available: false,
      access_path: FEDERAL_DNC_V01_ACCESS_PATH,
      user_message: FEDERAL_DNC_UNAVAILABLE_USER_MESSAGE,
    });
  });
});
