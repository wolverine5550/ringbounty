import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";
import type { Database } from "@/types/database";

import { upsertSeedViolationsBatch } from "./upsert-seed-violations-batch";
import type { SeedViolationUpsertRow } from "./types";

const sampleRow: SeedViolationUpsertRow = {
  phone_number_normalized: "+18005551234",
  reported_company_name: null,
  confidence_level: "ftc_complaint_low",
  violation_count: 1,
  source: "ftc_complaint",
  litigation_status: null,
  last_refreshed_at: "2026-05-19T00:00:00.000Z",
  metadata: {
    ftc_subject: "Other",
    complaint_count: 1,
    robocall_majority: true,
    last_violation_at: null,
    source_file_dates: ["2026-05-15"],
  },
};

describe("upsertSeedViolationsBatch (CI-2.1.3)", () => {
  it("upserts in batches with onConflict phone PK", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockReturnValue({
      upsert,
    } as ReturnType<typeof admin.from>);

    const result = await upsertSeedViolationsBatch(
      admin as SupabaseClient<Database>,
      [sampleRow],
    );

    expect(result).toEqual({ upserted: 1, batches: 1 });
    expect(upsert).toHaveBeenCalledWith([sampleRow], {
      onConflict: "phone_number_normalized",
    });
  });
});
