import { describe, expect, it } from "vitest";

import {
  canProceedPastFederalDncGate,
  parseFederalDncRegistrationDate,
  validateFederalDncAttestation,
} from "./federal-dnc-attestation-gate";

describe("federal-dnc-attestation-gate (§6.2.1)", () => {
  it("parses valid YYYY-MM-DD", () => {
    expect(parseFederalDncRegistrationDate("2007-10-17")).toBe("2007-10-17");
  });

  it("rejects invalid registration dates", () => {
    expect(parseFederalDncRegistrationDate("10/17/2007")).toBeNull();
  });

  it("allows proceed when registered with date", () => {
    expect(
      canProceedPastFederalDncGate({
        federalDncRegistered: true,
        federalDncRegistrationDate: "2007-10-17",
      }),
    ).toBe(true);
  });

  it("allows proceed when not registered without date", () => {
    expect(
      validateFederalDncAttestation({
        federalDncRegistered: false,
        federalDncRegistrationDate: "",
      }),
    ).toEqual({
      ok: true,
      value: {
        federalDncRegistered: false,
        federalDncRegistrationDate: null,
      },
    });
  });

  it("blocks when registered but date missing", () => {
    expect(
      validateFederalDncAttestation({
        federalDncRegistered: true,
        federalDncRegistrationDate: "",
      }).ok,
    ).toBe(false);
  });

  it("blocks when yes/no not answered", () => {
    expect(
      canProceedPastFederalDncGate({
        federalDncRegistered: null,
        federalDncRegistrationDate: "",
      }),
    ).toBe(false);
  });
});
