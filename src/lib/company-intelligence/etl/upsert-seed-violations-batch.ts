/**
 * CI-2.1.3 — Batch upsert into `seed_violations` (service_role / admin client).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import type { SeedViolationUpsertRow } from "./types";

export const SEED_VIOLATIONS_UPSERT_BATCH_SIZE = 500;

export type UpsertSeedViolationsResult = {
  upserted: number;
  batches: number;
};

/**
 * Upsert rows by `phone_number_normalized`. Replaces prior row for each phone in batch.
 */
export async function upsertSeedViolationsBatch(
  admin: SupabaseClient<Database>,
  rows: SeedViolationUpsertRow[],
  batchSize = SEED_VIOLATIONS_UPSERT_BATCH_SIZE,
): Promise<UpsertSeedViolationsResult> {
  if (rows.length === 0) {
    return { upserted: 0, batches: 0 };
  }

  let upserted = 0;
  let batches = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const { error } = await admin.from("seed_violations").upsert(chunk, {
      onConflict: "phone_number_normalized",
    });
    if (error) {
      throw new Error(`seed_violations upsert failed: ${error.message}`);
    }
    upserted += chunk.length;
    batches += 1;
  }

  return { upserted, batches };
}
