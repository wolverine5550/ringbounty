/**
 * Phase 6.2.4 — Upload optional federal DNC confirmation screenshot to Storage.
 */

import {
  buildFederalDncConfirmationStoragePath,
  FEDERAL_DNC_EVIDENCE_BUCKET,
  validateFederalDncEvidenceFile,
} from "@/lib/dnc/federal-dnc-evidence";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type UploadFederalDncEvidenceParams = {
  userId: string;
  claimId: string;
  claimSubjectId: string;
  file: File;
};

export type UploadFederalDncEvidenceResult =
  | { ok: true; storagePath: string }
  | { ok: false; error: string };

/**
 * Uploads to private `claim-evidence` bucket (RLS: first folder = `auth.uid()`).
 */
export async function uploadFederalDncConfirmationScreenshot(
  supabase: SupabaseClient<Database>,
  params: UploadFederalDncEvidenceParams,
): Promise<UploadFederalDncEvidenceResult> {
  const validated = validateFederalDncEvidenceFile(params.file);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }

  const storagePath = buildFederalDncConfirmationStoragePath(
    params.userId,
    params.claimId,
    params.claimSubjectId,
    validated.extension,
  );

  const bytes = await params.file.arrayBuffer();

  const { error } = await supabase.storage
    .from(FEDERAL_DNC_EVIDENCE_BUCKET)
    .upload(storagePath, bytes, {
      contentType: validated.mimeType,
      upsert: true,
    });

  if (error) {
    return {
      ok: false,
      error: "Could not upload screenshot. Please try again.",
    };
  }

  return { ok: true, storagePath };
}
