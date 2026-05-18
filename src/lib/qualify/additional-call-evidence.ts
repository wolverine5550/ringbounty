/**
 * Phase 7.5 — Q14 additional call evidence (screenshots, PDFs, notes) in `claim-evidence`.
 */

import { FEDERAL_DNC_EVIDENCE_BUCKET } from "@/lib/dnc/federal-dnc-evidence";

export { FEDERAL_DNC_EVIDENCE_BUCKET as ADDITIONAL_CALL_EVIDENCE_BUCKET };

/** `claim_events.key` — JSON array of Storage object paths. */
export const ADDITIONAL_EVIDENCE_PATHS_EVENT_KEY = "additional_evidence_paths";

/** Max files per claim subject on Screen 4. */
export const ADDITIONAL_CALL_EVIDENCE_MAX_FILES = 10;

/** Per-file limit (5 MiB), aligned with `claim-evidence` bucket. */
export const ADDITIONAL_CALL_EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
};

export type AdditionalCallEvidenceValidation =
  | { ok: true; mimeType: string; extension: string }
  | { ok: false; error: string };

export function validateAdditionalCallEvidenceFile(
  file: Pick<File, "size" | "type" | "name">,
): AdditionalCallEvidenceValidation {
  if (file.size <= 0) {
    return { ok: false, error: "File is empty." };
  }
  if (file.size > ADDITIONAL_CALL_EVIDENCE_MAX_BYTES) {
    return { ok: false, error: "Each file must be 5 MB or smaller." };
  }

  const mime = file.type.trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return {
      ok: false,
      error: "File must be a JPEG, PNG, WebP, GIF, PDF, or plain text (.txt).",
    };
  }

  const extension = MIME_TO_EXT[mime] ?? extensionFromFilename(file.name);
  if (!extension) {
    return { ok: false, error: "Could not determine file type." };
  }

  return { ok: true, mimeType: mime, extension };
}

function extensionFromFilename(name: string): string | null {
  const match = /\.(jpe?g|png|webp|gif|pdf|txt)$/i.exec(name.trim());
  if (!match) {
    return null;
  }
  const ext = match[0].toLowerCase();
  return ext === ".jpeg" ? ".jpg" : ext;
}

/**
 * `{userId}/{claimId}/{claimSubjectId}/additional-evidence/{fileId}{ext}`.
 */
export function buildAdditionalCallEvidenceStoragePath(
  userId: string,
  claimId: string,
  claimSubjectId: string,
  fileId: string,
  extension: string,
): string {
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  return `${userId}/${claimId}/${claimSubjectId}/additional-evidence/${fileId}${ext}`;
}

export function parseAdditionalEvidencePathsEventValue(
  value: string | null | undefined,
): string[] {
  if (!value?.trim()) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((p): p is string => typeof p === "string" && p.trim().length > 0);
  } catch {
    return [];
  }
}
