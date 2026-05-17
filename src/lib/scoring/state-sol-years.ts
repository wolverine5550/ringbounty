/**
 * Phase 8.2.1 — Per-state statute-of-limitations years (PRD §7 Step 5).
 *
 * Informational only — not legal advice. State companion claims and tolling
 * rules vary; replace overrides after counsel review.
 */

/** Used when `users.state` is missing or not recognized. */
export const DEFAULT_STATE_SOL_YEARS = 4;

/**
 * USPS two-letter overrides where a shorter consumer/TCPA-adjacent window is
 * commonly cited. All other recognized states use {@link DEFAULT_STATE_SOL_YEARS}.
 */
const STATE_SOL_YEARS_OVERRIDES: Readonly<Record<string, number>> = {
  // 3-year consumer / statutory windows often cited in multi-claim filings:
  AK: 3,
  AZ: 3,
  DC: 3,
  HI: 3,
  ID: 3,
  KS: 3,
  ME: 3,
  MT: 3,
  NE: 3,
  NM: 3,
  NY: 3,
  OK: 3,
  PA: 3,
  RI: 3,
  SC: 3,
  SD: 3,
  VT: 3,
  WA: 3,
  WV: 3,
  // 2-year examples (general tort caps — verify with counsel for TCPA):
  CA: 2,
  NH: 2,
};

const US_STATE_NAME_TO_CODE: Readonly<Record<string, string>> = {
  ALABAMA: "AL",
  ALASKA: "AK",
  ARIZONA: "AZ",
  ARKANSAS: "AR",
  CALIFORNIA: "CA",
  COLORADO: "CO",
  CONNECTICUT: "CT",
  DELAWARE: "DE",
  "DISTRICT OF COLUMBIA": "DC",
  FLORIDA: "FL",
  GEORGIA: "GA",
  HAWAII: "HI",
  IDAHO: "ID",
  ILLINOIS: "IL",
  INDIANA: "IN",
  IOWA: "IA",
  KANSAS: "KS",
  KENTUCKY: "KY",
  LOUISIANA: "LA",
  MAINE: "ME",
  MARYLAND: "MD",
  MASSACHUSETTS: "MA",
  MICHIGAN: "MI",
  MINNESOTA: "MN",
  MISSISSIPPI: "MS",
  MISSOURI: "MO",
  MONTANA: "MT",
  NEBRASKA: "NE",
  NEVADA: "NV",
  "NEW HAMPSHIRE": "NH",
  "NEW JERSEY": "NJ",
  "NEW MEXICO": "NM",
  "NEW YORK": "NY",
  "NORTH CAROLINA": "NC",
  "NORTH DAKOTA": "ND",
  OHIO: "OH",
  OKLAHOMA: "OK",
  OREGON: "OR",
  PENNSYLVANIA: "PA",
  "RHODE ISLAND": "RI",
  "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD",
  TENNESSEE: "TN",
  TEXAS: "TX",
  UTAH: "UT",
  VERMONT: "VT",
  VIRGINIA: "VA",
  WASHINGTON: "WA",
  "WEST VIRGINIA": "WV",
  WISCONSIN: "WI",
  WYOMING: "WY",
};

function normalizeStateCode(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) {
    return upper;
  }
  return US_STATE_NAME_TO_CODE[upper] ?? null;
}

/**
 * Returns informational state SOL years for `state` (PRD `get_state_sol(user.state)`).
 */
export function getStateSolYears(state: string): number {
  const code = normalizeStateCode(state);
  if (!code) {
    return DEFAULT_STATE_SOL_YEARS;
  }
  return STATE_SOL_YEARS_OVERRIDES[code] ?? DEFAULT_STATE_SOL_YEARS;
}

/** True when a two-letter or full US state name was recognized. */
export function isRecognizedUsState(state: string): boolean {
  return normalizeStateCode(state) !== null;
}
