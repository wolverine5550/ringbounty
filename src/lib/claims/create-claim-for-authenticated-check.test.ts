import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { createClaimWithSubjectsForAuthenticatedUser } from "./create-claim-for-authenticated-check";

describe("createClaimWithSubjectsForAuthenticatedUser", () => {
  const userId = "11111111-2222-4333-8444-555555555555";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a new owned claim and subjects, then sets status checking", async () => {
    const claimInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "claim-new" },
          error: null,
        }),
      })),
    }));

    const subjectInsert = vi.fn(() => ({
      select: vi.fn().mockResolvedValue({
        data: [{ id: "subject-1" }],
        error: null,
      }),
    }));

    const claimsUpdate = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }));

    const admin = {
      from: vi.fn((table: string) => {
        if (table === "claims") {
          return {
            insert: claimInsert,
            update: claimsUpdate,
          };
        }
        if (table === "claim_subjects") {
          return { insert: subjectInsert };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient<Database>;

    const out = await createClaimWithSubjectsForAuthenticatedUser(admin, userId, [
      {
        phoneNumberNormalized: "+17088928984",
        phoneNumberDisplay: "(708) 892-8984",
      },
    ]);

    expect(out).toEqual({ claimId: "claim-new", subjectIds: ["subject-1"] });
    expect(claimInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        anonymous_session_id: null,
        status: "draft",
      }),
    );
    expect(claimsUpdate).toHaveBeenCalled();
  });
});
