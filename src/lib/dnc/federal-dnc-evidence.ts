/**
 * Phase 6.2.4 — Optional FTC donotcall.gov confirmation screenshot (Storage + metadata).
 */

/** Private Supabase Storage bucket for user-uploaded claim evidence. */
export const FEDERAL_DNC_EVIDENCE_BUCKET = "claim-evidence";

/** `claim_subjects.metadata` + `claim_events` key for the storage object path. */
export const FEDERAL_DNC_CONFIRMATION_SCREENSHOT_METADATA_KEY =
  "federal_dnc_confirmation_screenshot_path";

/** Max upload size (5 MiB), aligned with bucket `file_size_limit`. */
export const FEDERAL_DNC_EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

export type FederalDncEvidenceValidation =
  | { ok: true; mimeType: string; extension: string }
  | { ok: false; error: string };

/**
 * Validates optional screenshot file before Storage upload.
 */
export function validateFederalDncEvidenceFile(
  file: Pick<File, "size" | "type" | "name">,
): FederalDncEvidenceValidation {
  if (file.size <= 0) {
    return { ok: false, error: "Screenshot file is empty." };
  }
  if (file.size > FEDERAL_DNC_EVIDENCE_MAX_BYTES) {
    return {
      ok: false,
      error: "File must be 5 MB or smaller.",
    };
  }

  const mime = file.type.trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return {
      ok: false,
      error: "File must be a JPEG, PNG, WebP, GIF image, or PDF.",
    };
  }

  const extension = MIME_TO_EXT[mime] ?? extensionFromFilename(file.name);
  if (!extension) {
    return { ok: false, error: "Could not determine file type." };
  }

  return { ok: true, mimeType: mime, extension };
}

function extensionFromFilename(name: string): string | null {
  const match = /\.(jpe?g|png|webp|gif|pdf)$/i.exec(name.trim());
  if (!match) {
    return null;
  }
  const ext = match[0].toLowerCase();
  return ext === ".jpeg" ? ".jpg" : ext;
}

/**
 * Storage object path: `{userId}/{claimId}/{claimSubjectId}/federal-dnc-confirmation{ext}`.
 */
export function buildFederalDncConfirmationStoragePath(
  userId: string,
  claimId: string,
  claimSubjectId: string,
  extension: string,
): string {
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  return `${userId}/${claimId}/${claimSubjectId}/federal-dnc-confirmation${ext}`;
}

export function getFederalDncScreenshotPathFromMetadata(
  metadata: unknown,
): string | null {
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const value = (metadata as Record<string, unknown>)[
    FEDERAL_DNC_CONFIRMATION_SCREENSHOT_METADATA_KEY
  ];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}
