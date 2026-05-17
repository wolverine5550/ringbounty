/**
 * Phase 13.2 — Storage paths and bucket for firm evidence PDFs.
 */

/** Private bucket; uploads use service_role (v0.1). */
export const LEAD_PACKAGES_BUCKET = "lead-packages";

/** Object path within bucket: `{leadId}/evidence-package.pdf`. */
export function buildLeadEvidencePdfStoragePath(leadId: string): string {
  return `${leadId}/evidence-package.pdf`;
}

/** Stored on `leads.evidence_pdf_url` as `bucket:objectPath` for admin retrieval. */
export function formatLeadEvidencePdfUrlRef(
  bucket: string,
  objectPath: string,
): string {
  return `${bucket}:${objectPath}`;
}

export function parseLeadEvidencePdfUrlRef(
  ref: string,
): { bucket: string; objectPath: string } | null {
  const idx = ref.indexOf(":");
  if (idx <= 0) {
    return null;
  }
  const bucket = ref.slice(0, idx);
  const objectPath = ref.slice(idx + 1);
  if (!bucket || !objectPath) {
    return null;
  }
  return { bucket, objectPath };
}
