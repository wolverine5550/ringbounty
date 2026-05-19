import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";
import type { Database } from "@/types/database";

import {
  evaluateSeedViolationRound1,
  querySeedViolations,
  SEED_HIGH_COMPLAINT_COUNT_THRESHOLD,
  writeBackSeedViolationFromAgent,
} from "./seed-violations";

function seedRow(overrides: Record<string, unknown> = {}) {
  return {
    phone_number_normalized: "+18005551234",
    reported_company_name: null,
    confidence_level: "ftc_complaint_high",
    violation_count: 60,
    source: "ftc_complaint",
    litigation_status: null,
    metadata: {
      ftc_subject: "Reducing your debt",
      complaint_count: 60,
    },
    ...overrides,
  };
}

describe("querySeedViolations (CI-2.2.1)", () => {
  it("returns null when no row", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ maybeSingle }),
      }),
    } as ReturnType<typeof admin.from>);

    const result = await querySeedViolations(admin, "+18005551234");
    expect(result).toBeNull();
  });

  it("maps row to SeedViolationLookup", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: seedRow(),
      error: null,
    });
    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ maybeSingle }),
      }),
    } as ReturnType<typeof admin.from>);

    const result = await querySeedViolations(admin, "+18005551234");
    expect(result?.violationCount).toBe(60);
    expect(result?.metadata?.ftc_subject).toBe("Reducing your debt");
  });
});

describe("evaluateSeedViolationRound1 (CI-2.2.2)", () => {
  const base = {
    phoneNumberNormalized: "+18005551234",
    confidenceLevel: "ftc_complaint_high",
    violationCount: 60,
    source: "ftc_complaint",
    litigationStatus: null,
    metadata: {
      ftc_subject: "Other",
      complaint_count: 60,
    },
  } as const;

  it("Path A: substantive name + count > 50 → confidence 85, skip paid rounds", () => {
    const result = evaluateSeedViolationRound1({
      ...base,
      reportedCompanyName: "CarShield",
    });

    expect(result.stoppedEarly).toBe(true);
    expect(result.skipPaidRounds).toBe(true);
    expect(result.synthesis?.companyName).toBe("CarShield");
    expect(result.synthesis?.confidence).toBe(85);
  });

  it("Path B: high count, no name → category suggest, paid rounds allowed", () => {
    const result = evaluateSeedViolationRound1({
      ...base,
      reportedCompanyName: null,
    });

    expect(result.stoppedEarly).toBe(true);
    expect(result.skipPaidRounds).toBe(false);
    expect(result.synthesis?.companyName).toBeNull();
    expect(result.synthesis?.callCategory).toBe("Other");
    expect(result.synthesis?.reasoning).toContain("complaint category");
  });

  it("no short-circuit when count at threshold", () => {
    const result = evaluateSeedViolationRound1({
      ...base,
      violationCount: SEED_HIGH_COMPLAINT_COUNT_THRESHOLD,
      metadata: { ftc_subject: "Other", complaint_count: 50 },
      reportedCompanyName: null,
    });

    expect(result.stoppedEarly).toBe(false);
    expect(result.synthesis).toBeNull();
  });
});

describe("writeBackSeedViolationFromAgent (CI-2.2.3)", () => {
  it("upserts substantive company name for next lookup", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockReturnValue({ upsert } as ReturnType<
      typeof admin.from
    >);

    await writeBackSeedViolationFromAgent(
      admin as SupabaseClient<Database>,
      {
        phoneNumberNormalized: "+18005551234",
        companyName: "Acme Corp",
        confidence: 90,
        runId: "run-1",
      },
    );

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        phone_number_normalized: "+18005551234",
        reported_company_name: "Acme Corp",
        source: "company_intelligence_agent",
      }),
      { onConflict: "phone_number_normalized" },
    );
  });

  it("skips write-back for placeholder names", async () => {
    const upsert = vi.fn();
    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockReturnValue({ upsert } as ReturnType<
      typeof admin.from
    >);

    await writeBackSeedViolationFromAgent(admin, {
      phoneNumberNormalized: "+18005551234",
      companyName: "UNKNOWN",
      confidence: 50,
    });

    expect(upsert).not.toHaveBeenCalled();
  });
});
