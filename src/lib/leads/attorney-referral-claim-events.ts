/**
 * Phase 13.1 — `claim_events` keys for attorney referral + evidence PDF queue.
 */

import type { ClaimEventType } from "@/lib/constants/claimEvent";

export const ATTORNEY_REFERRAL_EVENT_TYPE: ClaimEventType = "attorney_referral";

export const ATTORNEY_REFERRAL_EVENT_KEYS = {
  leadId: "lead_id",
  subjectIds: "subject_ids",
  leadSharingConsent: "lead_sharing_consent",
  evidencePdfJobStatus: "evidence_pdf_job_status",
  confirmationEmailStatus: "confirmation_email_status",
} as const;

export const EVIDENCE_PDF_JOB_QUEUED = "queued" as const;
export const EVIDENCE_PDF_JOB_COMPLETED = "completed" as const;
export const EVIDENCE_PDF_JOB_FAILED = "failed" as const;
