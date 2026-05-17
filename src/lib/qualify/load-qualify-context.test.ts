import { describe, expect, it } from "vitest";

import {
  claimQueryMatchesSubject,
  loadQualifyPageContext,
} from "./load-qualify-context";

const SUBJECT_ID = "11111111-1111-4111-8111-111111111111";
const CLAIM_ID = "22222222-2222-4222-8222-222222222222";
const USER_ID = "33333333-3333-4333-8333-333333333333";

function mockSupabaseForQualifyLoad(options: {
  subject: Record<string, unknown> | null;
  claim: Record<string, unknown> | null;
}) {
  return {
    from: (table: string) => {
      if (table === "claim_subjects") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: options.subject,
                error: null,
              }),
            }),
          }),
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

describe("loadQualifyPageContext (§7.1.2)", () => {
  it("returns subject and claim for owned rows", async () => {
    const ctx = await loadQualifyPageContext(
      mockSupabaseForQualifyLoad({
        subject: {
          id: SUBJECT_ID,
          claim_id: CLAIM_ID,
          phone_number: "(555) 000-0000",
          metadata: {},
          is_exempt: false,
          company_identified: true,
          call_category: "telemarketer",
        },
        claim: {
          id: CLAIM_ID,
          user_id: USER_ID,
          claim_strength: "moderate",
        },
      }) as never,
      { claimSubjectId: SUBJECT_ID, userId: USER_ID },
    );

    expect(ctx?.subject.id).toBe(SUBJECT_ID);
    expect(ctx?.claim.id).toBe(CLAIM_ID);
  });

  it("returns null when claim is not owned", async () => {
    const ctx = await loadQualifyPageContext(
      mockSupabaseForQualifyLoad({
        subject: {
          id: SUBJECT_ID,
          claim_id: CLAIM_ID,
          phone_number: null,
          metadata: null,
          is_exempt: false,
          company_identified: false,
          call_category: null,
        },
        claim: {
          id: CLAIM_ID,
          user_id: "other-user",
          claim_strength: null,
        },
      }) as never,
      { claimSubjectId: SUBJECT_ID, userId: USER_ID },
    );

    expect(ctx).toBeNull();
  });

  it("returns null for invalid uuid", async () => {
    const ctx = await loadQualifyPageContext({ from: () => ({}) } as never, {
      claimSubjectId: "not-a-uuid",
      userId: USER_ID,
    });
    expect(ctx).toBeNull();
  });
});

describe("claimQueryMatchesSubject", () => {
  it("allows missing claim query", () => {
    expect(claimQueryMatchesSubject(null, CLAIM_ID)).toBe(true);
  });

  it("rejects mismatched claim query", () => {
    expect(claimQueryMatchesSubject("other", CLAIM_ID)).toBe(false);
  });
});
