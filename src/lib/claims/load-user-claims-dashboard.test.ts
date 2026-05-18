import { describe, expect, it, vi } from "vitest";

import { loadUserClaimsDashboard } from "./load-user-claims-dashboard";

describe("loadUserClaimsDashboard", () => {
  it("skips claims without subjects and formats phone labels", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "empty",
                  status: "draft",
                  claim_strength: null,
                  created_at: "2026-01-01T00:00:00Z",
                  updated_at: "2026-01-02T00:00:00Z",
                  claim_subjects: [],
                },
                {
                  id: "claim-1",
                  status: "draft",
                  claim_strength: "moderate",
                  created_at: "2026-01-03T00:00:00Z",
                  updated_at: "2026-01-04T00:00:00Z",
                  claim_subjects: [
                    {
                      id: "sub-1",
                      phone_number: null,
                      phone_number_normalized: "+12125550199",
                      company_name: "Acme Co",
                    },
                  ],
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    };

    const dashboard = await loadUserClaimsDashboard(supabase as never, "user-1");

    expect(dashboard.totalChecks).toBe(1);
    expect(dashboard.totalNumbers).toBe(1);
    expect(dashboard.claims[0]?.phoneLabels).toEqual(["(212) 555-0199"]);
    expect(dashboard.claims[0]?.companyNames).toEqual(["Acme Co"]);
    expect(dashboard.claims[0]?.qualifyHref).toBe("/qualify/sub-1");
    expect(dashboard.claims[0]?.resultsHref).toBe("/results?claim=claim-1");
  });
});
