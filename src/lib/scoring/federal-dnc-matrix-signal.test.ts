import { describe, expect, it } from "vitest";

import {
  FEDERAL_DNC_MATRIX_ELIGIBLE_POINTS,
  resolveFederalDncMatrixSignal,
} from "./federal-dnc-matrix-signal";

describe("federal-dnc-matrix-signal (§6.1.3)", () => {
  it("never awards +25 when automated check is unavailable", () => {
    expect(
      resolveFederalDncMatrixSignal({ federalDncEligible: true }, {}),
    ).toEqual({ tier: "unavailable", points: 0 });
  });

  it("awards +25 only when automated check is on and eligible", () => {
    expect(
      resolveFederalDncMatrixSignal(
        { federalDncEligible: true, automatedCheckAvailable: true },
        { FEDERAL_DNC_AUTOMATED_ENABLED: "true" },
      ),
    ).toEqual({
      tier: "eligible",
      points: FEDERAL_DNC_MATRIX_ELIGIBLE_POINTS,
    });
  });

  it("returns none/0 when automated on but not eligible", () => {
    expect(
      resolveFederalDncMatrixSignal(
        { federalDncEligible: false, automatedCheckAvailable: true },
        { FEDERAL_DNC_AUTOMATED_ENABLED: "true" },
      ),
    ).toEqual({ tier: "none", points: 0 });
  });

  it("awards +25 from user attestation when eligible (no registry API)", () => {
    expect(
      resolveFederalDncMatrixSignal({
        attestedByUser: true,
        federalDncEligible: true,
      }),
    ).toEqual({
      tier: "eligible",
      points: FEDERAL_DNC_MATRIX_ELIGIBLE_POINTS,
    });
  });

  it("returns none/0 when user attested but not eligible", () => {
    expect(
      resolveFederalDncMatrixSignal({
        attestedByUser: true,
        federalDncEligible: false,
      }),
    ).toEqual({ tier: "none", points: 0 });
  });
});
