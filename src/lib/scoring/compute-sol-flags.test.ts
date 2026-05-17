import { describe, expect, it } from "vitest";

import { computeSolFlags } from "./compute-sol-flags";
import { FEDERAL_TCPA_SOL_YEARS } from "./federal-sol-years";

const REFERENCE = new Date("2026-05-17T12:00:00.000Z");

describe("computeSolFlags (§8.2.2–8.2.3)", () => {
  it("marks within federal SOL when call is inside 4-year window", () => {
    const result = computeSolFlags({
      mostRecentCallDate: "2024-01-01",
      userState: "TX",
      referenceDate: REFERENCE,
    });

    expect(result).toEqual({
      withinFederalSol: true,
      withinStateSol: true,
      likelyTimeBarred: false,
      federalSolYears: FEDERAL_TCPA_SOL_YEARS,
      stateSolYears: 4,
    });
  });

  it("sets likely_time_barred when outside federal and state SOL", () => {
    const result = computeSolFlags({
      mostRecentCallDate: "2020-01-01",
      userState: "CA",
      referenceDate: REFERENCE,
    });

    expect(result?.withinFederalSol).toBe(false);
    expect(result?.withinStateSol).toBe(false);
    expect(result?.likelyTimeBarred).toBe(true);
  });

  it("does not flag time-barred when only federal is outside SOL", () => {
    const result = computeSolFlags({
      mostRecentCallDate: "2023-06-01",
      userState: "CA",
      referenceDate: REFERENCE,
    });

    expect(result?.withinFederalSol).toBe(true);
    expect(result?.withinStateSol).toBe(false);
    expect(result?.likelyTimeBarred).toBe(false);
  });

  it("leaves state SOL unknown when profile state is missing", () => {
    const result = computeSolFlags({
      mostRecentCallDate: "2020-01-01",
      userState: null,
      referenceDate: REFERENCE,
    });

    expect(result?.withinFederalSol).toBe(false);
    expect(result?.withinStateSol).toBeNull();
    expect(result?.likelyTimeBarred).toBe(false);
    expect(result?.stateSolYears).toBeNull();
  });

  it("returns null for invalid call dates", () => {
    expect(
      computeSolFlags({
        mostRecentCallDate: "not-a-date",
        userState: "NY",
        referenceDate: REFERENCE,
      }),
    ).toBeNull();
  });
});
