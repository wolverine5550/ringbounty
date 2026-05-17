/**
 * Phase 13.2 — Queue marker + synchronous PDF generation (v0.1).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { enqueueEvidencePdfJob } from "@/lib/leads/enqueue-evidence-pdf-job";
import type { Database } from "@/types/database";

import { generateAndUploadEvidencePdf } from "./evidence-pdf/generate-and-upload-evidence-pdf";

/**
 * Records queue status then builds/uploads the evidence PDF for a lead.
 */
export async function runEvidencePdfJob(
  admin: SupabaseClient<Database>,
  params: { claimId: string; leadId: string },
): Promise<void> {
  await enqueueEvidencePdfJob(admin, params);

  try {
    await generateAndUploadEvidencePdf(admin, { leadId: params.leadId });
  } catch (error) {
    console.error("runEvidencePdfJob failed", {
      claimId: params.claimId,
      leadId: params.leadId,
      error,
    });
  }
}
