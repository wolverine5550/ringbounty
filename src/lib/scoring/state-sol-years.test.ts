import { describe, expect, it } from "vitest";

import {
  DEFAULT_STATE_SOL_YEARS,
  getStateSolYears,
  isRecognizedUsState,
} from "./state-sol-years";

describe("getStateSolYears (§8.2.1)", () => {
  it("returns default for unknown state input", () => {
    expect(getStateSolYears("")).toBe(DEFAULT_STATE_SOL_YEARS);
    expect(getStateSolYears("Not A State")).toBe(DEFAULT_STATE_SOL_YEARS);
  });

  it("returns default for states without overrides", () => {
    expect(getStateSolYears("TX")).toBe(4);
    expect(getStateSolYears("Texas")).toBe(4);
  });

  it("returns override years when configured", () => {
    expect(getStateSolYears("CA")).toBe(2);
    expect(getStateSolYears("California")).toBe(2);
    expect(getStateSolYears("NY")).toBe(3);
  });

  it("recognizes two-letter and full state names", () => {
    expect(isRecognizedUsState("co")).toBe(true);
    expect(isRecognizedUsState("Colorado")).toBe(true);
    expect(isRecognizedUsState("XX")).toBe(true);
  });
});
