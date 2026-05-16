/**
 * Phase 6.2.1 — Client/server validation for federal DNC attestation gate.
 */

import { FEDERAL_DNC_GATE_BLOCKED_MESSAGE } from "@/lib/constants/federal-dnc-attestation";

/** Parsed attestation payload when the gate allows proceed. */
export type FederalDncAttestationInput = {
  federalDncRegistered: boolean;
  /** `YYYY-MM-DD` when registered; null when user answered no. */
  federalDncRegistrationDate: string | null;
};

export type FederalDncAttestationValidation =
  | { ok: true; value: FederalDncAttestationInput }
  | { ok: false; error: string };

/**
 * Validates `YYYY-MM-DD` for storage in `dnc_check_results.federal_dnc_registration_date`.
 */
export function parseFederalDncRegistrationDate(value: string): string | null {
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return null;
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return trimmed;
}

/**
 * True when the user has answered registered yes/no and supplied a date when required.
 */
export function canProceedPastFederalDncGate(input: {
  federalDncRegistered: boolean | null;
  federalDncRegistrationDate: string;
}): boolean {
  return validateFederalDncAttestation(input).ok;
}

/**
 * Shared validation for API + qualify form submit.
 */
export function validateFederalDncAttestation(input: {
  federalDncRegistered: boolean | null;
  federalDncRegistrationDate: string;
}): FederalDncAttestationValidation {
  if (input.federalDncRegistered === null) {
    return { ok: false, error: FEDERAL_DNC_GATE_BLOCKED_MESSAGE };
  }

  if (!input.federalDncRegistered) {
    return {
      ok: true,
      value: {
        federalDncRegistered: false,
        federalDncRegistrationDate: null,
      },
    };
  }

  const parsed = parseFederalDncRegistrationDate(
    input.federalDncRegistrationDate,
  );
  if (!parsed) {
    return {
      ok: false,
      error: "Enter a valid registration date (YYYY-MM-DD).",
    };
  }

  return {
    ok: true,
    value: {
      federalDncRegistered: true,
      federalDncRegistrationDate: parsed,
    },
  };
}
