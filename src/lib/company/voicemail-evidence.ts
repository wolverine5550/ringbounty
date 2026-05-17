/**
 * Phase 7.5.4 — Voicemail audio upload validation and Storage paths.
 */

import { FEDERAL_DNC_EVIDENCE_BUCKET } from "@/lib/dnc/federal-dnc-evidence";

/** Reuse private evidence bucket (same RLS as federal DNC screenshot). */
export const VOICEMAIL_EVIDENCE_BUCKET = FEDERAL_DNC_EVIDENCE_BUCKET;

/** `claim_subjects.metadata` key for uploaded voicemail object path. */
export const VOICEMAIL_AUDIO_METADATA_KEY = "voicemail_audio_path";

/** Max voicemail upload (10 MiB). */
export const VOICEMAIL_EVIDENCE_MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
]);

const MIME_TO_FORMAT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
};

const MIME_TO_EXT: Record<string, string> = {
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/m4a": ".m4a",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/wave": ".wav",
};

export type VoicemailEvidenceValidation =
  | { ok: true; mimeType: string; extension: string; openRouterFormat: string }
  | { ok: false; error: string };

/**
 * Validates voicemail audio before Storage upload and OpenRouter transcription.
 */
export function validateVoicemailEvidenceFile(
  file: Pick<File, "size" | "type" | "name">,
): VoicemailEvidenceValidation {
  if (file.size <= 0) {
    return { ok: false, error: "Audio file is empty." };
  }
  if (file.size > VOICEMAIL_EVIDENCE_MAX_BYTES) {
    return { ok: false, error: "Voicemail must be 10 MB or smaller." };
  }

  const mime = file.type.trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return {
      ok: false,
      error: "Voicemail must be an MP3, M4A, or WAV file.",
    };
  }

  const extension = MIME_TO_EXT[mime] ?? extensionFromFilename(file.name);
  const openRouterFormat = MIME_TO_FORMAT[mime];
  if (!extension || !openRouterFormat) {
    return { ok: false, error: "Could not determine audio type." };
  }

  return { ok: true, mimeType: mime, extension, openRouterFormat };
}

function extensionFromFilename(name: string): string | null {
  const match = /\.(mp3|m4a|wav)$/i.exec(name.trim());
  if (!match) {
    return null;
  }
  return `.${match[1].toLowerCase()}`;
}

/** Storage path: `{userId}/{claimId}/{claimSubjectId}/voicemail{ext}`. */
export function buildVoicemailStoragePath(
  userId: string,
  claimId: string,
  claimSubjectId: string,
  extension: string,
): string {
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  return `${userId}/${claimId}/${claimSubjectId}/voicemail${ext}`;
}

export function getVoicemailAudioPathFromMetadata(metadata: unknown): string | null {
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const value = (metadata as Record<string, unknown>)[VOICEMAIL_AUDIO_METADATA_KEY];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}
