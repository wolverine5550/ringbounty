import type { FirmLeadFilters } from "./firm-lead-filters";

export type FirmLeadListRow = {
  id: string;
  status: string;
  claim_strength: string | null;
  estimated_value_realistic_cents: number | null;
  estimated_value_low_cents: number | null;
  violation_type: string;
  assigned_firm_id: string | null;
  created_at: string;
  consumer_state: string | null;
};

/**
 * Client-side refinement on top of RLS-backed rows (§13.4.3).
 */
export function applyFirmLeadFilters(
  rows: FirmLeadListRow[],
  filters: FirmLeadFilters,
): FirmLeadListRow[] {
  return rows.filter((row) => {
    if (filters.state && row.consumer_state?.toUpperCase() !== filters.state) {
      return false;
    }

    if (filters.strength && row.claim_strength !== filters.strength) {
      return false;
    }

    if (filters.minValueCents != null) {
      const value =
        row.estimated_value_realistic_cents ??
        row.estimated_value_low_cents ??
        0;
      if (value < filters.minValueCents) {
        return false;
      }
    }

    return true;
  });
}
