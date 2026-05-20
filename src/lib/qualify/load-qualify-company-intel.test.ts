import { describe, expect, it } from "vitest";

import { loadQualifyCompanyIntelSnapshot } from "./load-qualify-company-intel";

const SUBJECT_ID = "11111111-1111-4111-8111-111111111111";
const CLAIM_ID = "22222222-2222-4222-8222-222222222222";
const USER_ID = "33333333-3333-4333-8333-333333333333";

function mockSupabaseForIntelLoad(options: {
  subject: Record<string, unknown> | null;
  claim: Record<string, unknown> | null;
  intelRow: Record<string, unknown> | null;
}) {
  return {
    from: (table: string) => {
      if (table === "claim_subjects") {
        return {
          select: (columns: string) => {
            const isIntelSelect = columns.includes("company_intel_status");
            return {
              eq: () => {
                if (isIntelSelect) {
                  return {
                    maybeSingle: async () => ({
                      data: options.intelRow,
                      error: null,
                    }),
                  };
                }
                return {
                  maybeSingle: async () => ({
                    data: options.subject,
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }
      if (table === "claims") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: options.claim,
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

describe("loadQualifyCompanyIntelSnapshot (CI-8.1)", () => {
  it("returns suggest fields for owned subject", async () => {
    const snapshot = await loadQualifyCompanyIntelSnapshot(
      mockSupabaseForIntelLoad({
        subject: {
          id: SUBJECT_ID,
          claim_id: CLAIM_ID,
          phone_number: "(555) 000-0000",
          phone_number_normalized: "+15550000000",
          metadata: {},
          is_exempt: false,
          company_identified: false,
          company_name: null,
          call_category: null,
        },
        claim: {
          id: CLAIM_ID,
          user_id: USER_ID,
          claim_strength: null,
        },
        intelRow: {
          company_intel_status: "completed",
          company_name_suggested: "Acme Collections LLC",
          company_intel_confidence: 85,
          company_intel_reasoning: "FTC seed match with high complaint volume.",
        },
      }) as never,
      { claimSubjectId: SUBJECT_ID, userId: USER_ID },
    );

    expect(snapshot).toEqual({
      status: "completed",
      company_name_suggested: "Acme Collections LLC",
      confidence: 85,
      reasoning: "FTC seed match with high complaint volume.",
    });
  });

  it("returns null when claim is not owned", async () => {
    const snapshot = await loadQualifyCompanyIntelSnapshot(
      mockSupabaseForIntelLoad({
        subject: {
          id: SUBJECT_ID,
          claim_id: CLAIM_ID,
          phone_number: null,
          phone_number_normalized: null,
          metadata: null,
          is_exempt: false,
          company_identified: false,
          company_name: null,
          call_category: null,
        },
        claim: {
          id: CLAIM_ID,
          user_id: "other-user",
          claim_strength: null,
        },
        intelRow: null,
      }) as never,
      { claimSubjectId: SUBJECT_ID, userId: USER_ID },
    );

    expect(snapshot).toBeNull();
  });

  it("returns null for invalid uuid", async () => {
    const snapshot = await loadQualifyCompanyIntelSnapshot({ from: () => ({}) } as never, {
      claimSubjectId: "not-a-uuid",
      userId: USER_ID,
    });
    expect(snapshot).toBeNull();
  });
});
