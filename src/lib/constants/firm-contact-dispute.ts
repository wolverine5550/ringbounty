/**
 * Phase 13.8 — Consumer "Issue with firm contact" dispute reasons.
 */

export const FIRM_CONTACT_DISPUTE_REASONS = [
  "no_contact",
  "contact_issue",
  "other",
] as const;

export type FirmContactDisputeReason =
  (typeof FIRM_CONTACT_DISPUTE_REASONS)[number];

export const FIRM_CONTACT_DISPUTE_REASON_LABELS: Record<
  FirmContactDisputeReason,
  string
> = {
  no_contact: "The firm has not contacted me",
  contact_issue: "There is a problem with how the firm contacted me",
  other: "Other issue with firm contact",
};

/** Max length for optional free-text details (stored on `claim_events`). */
export const FIRM_CONTACT_DISPUTE_DETAILS_MAX_LENGTH = 2000;

export const FIRM_CONTACT_DISPUTE_FORM_TITLE = "Issue with firm contact";

export const FIRM_CONTACT_DISPUTE_FORM_INTRO =
  "Tell us if a participating firm has not followed up as expected. RingBounty will review your report; this is not legal advice and does not guarantee a refund.";

export const FIRM_CONTACT_DISPUTE_SUBMIT_LABEL = "Submit issue";

export const FIRM_CONTACT_DISPUTE_SUCCESS_MESSAGE =
  "We received your report. Our team will review it and may follow up by email.";
