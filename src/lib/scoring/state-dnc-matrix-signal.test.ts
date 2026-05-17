import { describe, expect, it } from "vitest";

import {
  resolveStateDncMatrixSignal,
  STATE_DNC_MATRIX_REGISTERED_POINTS,
} from "./state-dnc-matrix-signal";

describe("resolveStateDncMatrixSignal (§6.3)", () => {
  it("returns 0 when not applicable or unchecked", () => {
    expect(
      resolveStateDncMatrixSignal({
        stateDncApplicable: true,
        stateDncRegistered: null,
      }),
    ).toEqual({ tier: "none", points: 0 });
    expect(
      resolveStateDncMatrixSignal({ stateDncApplicable: false }),
    ).toEqual({ tier: "unavailable", points: 0 });
  });

  it("returns +10 only when registered", () => {
    expect(
      resolveStateDncMatrixSignal({
        stateDncApplicable: true,
        stateDncRegistered: true,
      }),
    ).toEqual({
      tier: "registered",
      points: STATE_DNC_MATRIX_REGISTERED_POINTS,
    });
  });
});
