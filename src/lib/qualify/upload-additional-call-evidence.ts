/**
 * Upload Q14 additional evidence files to private `claim-evidence` Storage.
 */

import {
  ADDITIONAL_CALL_EVIDENCE_BUCKET,
  buildAdditionalCallEvidenceStoragePath,
  validateAdditionalCallEvidenceFile,
} from "@/lib/qualify/additional-call-evidence";
import type { SupabaseClient } from "@supabase/supabase-js";

export type UploadAdditionalCallEvidenceParams = {
  userId: string;
  claimId: string;
  claimSubjectId: string;
  files: File[];
};

export type UploadAdditionalCallEvidenceResult =
  | { ok: true; storagePaths: string[] }
  | { ok: false; error: string };

/**
 * Uploads each file under the user's folder (RLS: first path segment = `auth.uid()`).
 */
export async function uploadAdditionalCallEvidenceFiles(
  supabase: SupabaseClient,
  params: UploadAdditionalCallEvidenceParams,
): Promise<UploadAdditionalCallEvidenceResult> {
  const paths: string[] = [];

  for (const file of params.files) {
    const validated = validateAdditionalCallEvidenceFile(file);
    if (!validated.ok) {
      return {
        ok: false,
        error: `${file.name}: ${validated.error}`,
      };
    }

    const fileId = crypto.randomUUID();
    const storagePath = buildAdditionalCallEvidenceStoragePath(
      params.userId,
      params.claimId,
      params.claimSubjectId,
      fileId,
      validated.extension,
    );

    const bytes = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from(ADDITIONAL_CALL_EVIDENCE_BUCKET)
      .upload(storagePath, bytes, {
        contentType: validated.mimeType,
        upsert: false,
      });

    if (error) {
      return {
        ok: false,
        error: `Could not upload ${file.name}. Please try again.`,
      };
    }

    paths.push(storagePath);
  }

  return { ok: true, storagePaths: paths };
}
