/**
 * Phase 7.2 — Screen 1 intro ack (no consent answers yet).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { persistQualifyResumeStep } from "./qualify-step";

/** Records that the user passed the orientation screen (resume step 1). */
export async function persistQualifyIntroAck(
  supabase: SupabaseClient<Database>,
  params: { claimId: string },
): Promise<void> {
  await persistQualifyResumeStep(supabase, { claimId: params.claimId, step: 1 });
}
