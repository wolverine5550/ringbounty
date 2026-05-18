import { describe, expect, it } from "vitest";

import { applyFirmLeadFilters, type FirmLeadListRow } from "./apply-firm-lead-filters";

const sample: FirmLeadListRow[] = [
  {
    id: "1",
    status: "new",
    claim_strength: "strong",
    estimated_value_realistic_cents: 50_000,
    estimated_value_low_cents: 40_000,
    violation_type: "tcpa",
    assigned_firm_id: null,
    created_at: "2026-05-17T00:00:00Z",
    consumer_state: "TX",
    consumer_email: null,
    consumer_full_name: null,
    evidence_pdf_url: null,
    accepted_at: null,
    contacted_at: null,
    retained_at: null,
    closed_at: null,
  },
  {
    id: "2",
    status: "new",
    claim_strength: "moderate",
    estimated_value_realistic_cents: 20_000,
    estimated_value_low_cents: 15_000,
    violation_type: "tcpa",
    assigned_firm_id: null,
    created_at: "2026-05-17T01:00:00Z",
    consumer_state: "CA",
    consumer_email: null,
    consumer_full_name: null,
    evidence_pdf_url: null,
    accepted_at: null,
    contacted_at: null,
    retained_at: null,
    closed_at: null,
  },
];

describe("applyFirmLeadFilters (§13.4.3)", () => {
  it("filters by state, strength, and min value", () => {
    const result = applyFirmLeadFilters(sample, {
      state: "TX",
      strength: "strong",
      minValueCents: 45_000,
    });
    expect(result.map((r) => r.id)).toEqual(["1"]);
  });
});
