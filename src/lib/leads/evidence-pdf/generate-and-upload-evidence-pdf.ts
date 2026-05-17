/**
 * Phase 13.2.1–13.2.2 — Build evidence PDF, upload to Storage, update `leads`.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ATTORNEY_REFERRAL_EVENT_KEYS,
  ATTORNEY_REFERRAL_EVENT_TYPE,
  EVIDENCE_PDF_JOB_COMPLETED,
  EVIDENCE_PDF_JOB_FAILED,
} from "@/lib/leads/attorney-referral-claim-events";
import type { Database } from "@/types/database";

import { buildEvidencePdfBuffer } from "./build-evidence-pdf-buffer";
import {
  buildLeadEvidencePdfStoragePath,
  formatLeadEvidencePdfUrlRef,
  LEAD_PACKAGES_BUCKET,
} from "./constants";
import { loadEvidencePdfContext } from "./load-evidence-pdf-context";

export type GenerateEvidencePdfResult =
  | { status: "completed"; evidencePdfUrl: string }
  | { status: "skipped_already_present"; evidencePdfUrl: string }
  | { status: "failed"; reason: string };

async function recordPdfJobStatus(
  admin: SupabaseClient<Database>,
  claimId: string,
  value: string,
): Promise<void> {
  await admin.from("claim_events").insert({
    claim_id: claimId,
    event_type: ATTORNEY_REFERRAL_EVENT_TYPE,
    key: ATTORNEY_REFERRAL_EVENT_KEYS.evidencePdfJobStatus,
    value,
    source: "system",
  });
}

/**
 * Compiles PDF, uploads to `lead-packages`, sets `leads.evidence_pdf_url`.
 */
export async function generateAndUploadEvidencePdf(
  admin: SupabaseClient<Database>,
  params: { leadId: string },
): Promise<GenerateEvidencePdfResult> {
  const { data: leadRow, error: leadFetchError } = await admin
    .from("leads")
    .select("id, claim_id, evidence_pdf_url")
    .eq("id", params.leadId)
    .maybeSingle();

  if (leadFetchError) {
    throw leadFetchError;
  }

  if (!leadRow?.id || !leadRow.claim_id) {
    return { status: "failed", reason: "lead_not_found" };
  }

  if (leadRow.evidence_pdf_url?.trim()) {
    return {
      status: "skipped_already_present",
      evidencePdfUrl: leadRow.evidence_pdf_url,
    };
  }

  try {
    const context = await loadEvidencePdfContext(admin, { leadId: params.leadId });
    if (!context) {
      await recordPdfJobStatus(admin, leadRow.claim_id, EVIDENCE_PDF_JOB_FAILED);
      return { status: "failed", reason: "context_load_failed" };
    }

    const pdfBuffer = await buildEvidencePdfBuffer(context);
    const objectPath = buildLeadEvidencePdfStoragePath(params.leadId);

    const { error: uploadError } = await admin.storage
      .from(LEAD_PACKAGES_BUCKET)
      .upload(objectPath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      await recordPdfJobStatus(admin, leadRow.claim_id, EVIDENCE_PDF_JOB_FAILED);
      return { status: "failed", reason: uploadError.message };
    }

    const evidencePdfUrl = formatLeadEvidencePdfUrlRef(
      LEAD_PACKAGES_BUCKET,
      objectPath,
    );

    const { error: updateError } = await admin
      .from("leads")
      .update({ evidence_pdf_url: evidencePdfUrl })
      .eq("id", params.leadId);

    if (updateError) {
      await recordPdfJobStatus(admin, leadRow.claim_id, EVIDENCE_PDF_JOB_FAILED);
      throw updateError;
    }

    await recordPdfJobStatus(admin, leadRow.claim_id, EVIDENCE_PDF_JOB_COMPLETED);

    return { status: "completed", evidencePdfUrl };
  } catch (e) {
    await recordPdfJobStatus(admin, leadRow.claim_id, EVIDENCE_PDF_JOB_FAILED);
    throw e;
  }
}
