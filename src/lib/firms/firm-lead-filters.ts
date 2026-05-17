/** UI filter values for the firm lead list (§13.4.3). */
export type FirmLeadFilters = {
  state: string | null;
  minValueCents: number | null;
  strength: string | null;
};

export const EMPTY_FIRM_LEAD_FILTERS: FirmLeadFilters = {
  state: null,
  minValueCents: null,
  strength: null,
};

/** Parses `searchParams` from `/firms/leads`. */
export function parseFirmLeadFilters(
  searchParams: Record<string, string | string[] | undefined>,
): FirmLeadFilters {
  const rawState = searchParams.state;
  const state =
    typeof rawState === "string" && rawState.trim()
      ? rawState.trim().toUpperCase()
      : null;

  const rawMin = searchParams.min_value;
  const minValueCents =
    typeof rawMin === "string" && rawMin.trim()
      ? Number.parseInt(rawMin, 10)
      : null;

  const rawStrength = searchParams.strength;
  const strength =
    typeof rawStrength === "string" && rawStrength.trim()
      ? rawStrength.trim().toLowerCase()
      : null;

  return {
    state,
    minValueCents: Number.isFinite(minValueCents) ? minValueCents : null,
    strength,
  };
}
