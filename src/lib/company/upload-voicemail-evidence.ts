/**
 * Phase 7.5.4 — Upload voicemail audio to private `claim-evidence` Storage.
 */

import {
  buildVoicemailStoragePath,
  validateVoicemailEvidenceFile,
  VOICEMAIL_EVIDENCE_BUCKET,
} from "@/lib/company/voicemail-evidence";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type UploadVoicemailEvidenceParams = {
  userId: string;
  claimId: string;
  claimSubjectId: string;
  file: File;
};

export type UploadVoicemailEvidenceResult =
  | { ok: true; storagePath: string; openRouterFormat: string }
  | { ok: false; error: string };

/**
 * Uploads voicemail to private bucket (RLS: first folder = `auth.uid()`).
 */
export async function uploadVoicemailAudio(
  supabase: SupabaseClient<Database>,
  params: UploadVoicemailEvidenceParams,
): Promise<UploadVoicemailEvidenceResult> {
  const validated = validateVoicemailEvidenceFile(params.file);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }

  const storagePath = buildVoicemailStoragePath(
    params.userId,
    params.claimId,
    params.claimSubjectId,
    validated.extension,
  );

  const bytes = await params.file.arrayBuffer();

  const { error } = await supabase.storage
    .from(VOICEMAIL_EVIDENCE_BUCKET)
    .upload(storagePath, bytes, {
      contentType: validated.mimeType,
      upsert: true,
    });

  if (error) {
    return {
      ok: false,
      error: "Could not upload voicemail. Please try again.",
    };
  }

  return {
    ok: true,
    storagePath,
    openRouterFormat: validated.openRouterFormat,
  };
}
