import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import { persistSpamCheckOutcome } from "./persist-spam-check-outcome";
import type { ProviderRunOutcome } from "./run-spam-checks";

describe("persistSpamCheckOutcome", () => {
  it("updates claim_subjects and inserts claim_events", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { metadata: null },
      error: null,
    });
    const selectEq = vi.fn().mockReturnValue({ maybeSingle });
    const update = vi.fn().mockReturnValue({ eq: updateEq });
    const select = vi.fn().mockReturnValue({ eq: selectEq });

    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockImplementation((table: string) => {
      if (table === "claim_subjects") {
        return { select, update } as ReturnType<typeof admin.from>;
      }
      if (table === "claim_events") {
        return { insert } as ReturnType<typeof admin.from>;
      }
      return { select, update, insert } as ReturnType<typeof admin.from>;
    });

    const outcomes: ProviderRunOutcome[] = [
      {
        status: "ok",
        result: {
          isSpam: true,
          score: 94,
          complaints: 844,
          category: "robocall",
          companyName: "Capital One",
          raw: { risk_score: 94 },
          providerId: "nomorobo",
        },
      },
      {
        status: "ok",
        result: {
          isSpam: false,
          score: 40,
          complaints: null,
          category: null,
          companyName: null,
          raw: { skipped: true, reason: "disabled" },
          providerId: "twilio",
        },
      },
    ];

    const merged = await persistSpamCheckOutcome(admin, {
      claimId: "claim-1",
      claimSubjectId: "subject-1",
      providerOutcomes: outcomes,
    });

    expect(merged.isKnownSpammer).toBe(true);
    expect(merged.spamDbSource).toBe("nomorobo");
    expect(updateEq).toHaveBeenCalled();
    expect(insert).toHaveBeenCalled();
    const rows = insert.mock.calls[0]?.[0] as Array<{ key: string | null }>;
    expect(rows.some((r) => r.key === "is_known_spammer")).toBe(true);
    expect(rows.some((r) => r.key === "provider_raw")).toBe(true);
  });
});
