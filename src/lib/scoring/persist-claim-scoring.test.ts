import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import { computeClaimScoring } from "./compute-claim-scoring";
import { persistClaimScoring } from "./persist-claim-scoring";
import {
  SCORING_CLAIM_EVENT_KEYS,
  SCORING_VALUE_CALCULATED_EVENT,
} from "./scoring-claim-events";

vi.mock("@/lib/qualify/screen-1-consent", () => ({
  loadQualifyScreen1Answers: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/qualify/screen-2-stop-request", () => ({
  loadQualifyScreen2Answers: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/qualify/screen-3-call-details", () => ({
  loadQualifyScreen3Answers: vi.fn().mockResolvedValue(null),
}));
vi.mock("./load-sol-flags", () => ({
  loadSolFlags: vi.fn().mockResolvedValue(null),
}));

vi.mock("./compute-claim-scoring", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./compute-claim-scoring")>();
  return {
    ...actual,
    computeClaimScoring: vi.fn(actual.computeClaimScoring),
  };
});

describe("persistClaimScoring (§8.5)", () => {
  it("skips when claim_strength is already set", async () => {
    const supabase = createMockSupabaseClient();

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "claims") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "claim-1", claim_strength: "moderate" },
                error: null,
              }),
            }),
          }),
        } as never;
      }
      return { insert: vi.fn() } as never;
    });

    const result = await persistClaimScoring(supabase, { claimId: "claim-1" });
    expect(result.persisted).toBe(false);
    expect(computeClaimScoring).not.toHaveBeenCalled();
  });

  it("updates claims and inserts value_calculated audit rows", async () => {
    const supabase = createMockSupabaseClient();
    const eventsInsert = vi.fn().mockResolvedValue({ error: null });
    const claimsUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "claims") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "claim-1", claim_strength: null },
                error: null,
              }),
            }),
          }),
          update: claimsUpdate,
        } as never;
      }
      if (table === "claim_subjects") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "sub-1",
                  is_exempt: false,
                  company_identified: true,
                  registered_agent_name: null,
                  spam_db_confidence_score: 90,
                },
              ],
              error: null,
            }),
          }),
        } as never;
      }
      if (table === "dnc_check_results") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as never;
      }
      if (table === "claim_events") {
        return { insert: eventsInsert } as never;
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      } as never;
    });

    const result = await persistClaimScoring(supabase, { claimId: "claim-1" });

    expect(result.persisted).toBe(true);
    expect(result.scoring?.claimStrength).toBeTruthy();
    expect(claimsUpdate).toHaveBeenCalled();
    expect(eventsInsert).toHaveBeenCalledTimes(1);

    const rows = eventsInsert.mock.calls[0][0] as Array<{
      event_type: string;
      key: string;
    }>;

    expect(
      rows.some(
        (r) =>
          r.event_type === SCORING_VALUE_CALCULATED_EVENT &&
          r.key === SCORING_CLAIM_EVENT_KEYS.claimStrength,
      ),
    ).toBe(true);
  });
});
