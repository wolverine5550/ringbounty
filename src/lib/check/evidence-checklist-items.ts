/**
 * Six evidence-preservation prompts from PRD §10, shown on `/attorney-connect` before referral (task_manager §4.2).
 * `prd.md` is not checked into this repo — keep wording aligned with legal/product review.
 *
 * Optional persistence: insert `claim_events` with `event_type: "evidence_checklist_ack"` (see `claimEvent.ts`)
 * when referral submit persists checklist acknowledgement.
 */

/** Section heading on attorney connect. */
export const EVIDENCE_PRESERVATION_HEADLINE = "Preserve your evidence";

/** Intro before attorney referral (PRD §10). */
export const EVIDENCE_PRESERVATION_INTRO =
  "Before we share your claim summary with attorneys, take a moment to save what you already have. Stronger evidence usually means a stronger profile — we do not guarantee any outcome.";

/** Continue-anyway acknowledgement on attorney connect. */
export const EVIDENCE_PRESERVATION_CONTINUE_ANYWAY_LABEL =
  "I understand I have not finished every checklist item above and still want to continue.";

export type EvidenceChecklistItem = {
  /** Stable key for checkbox state and tests. */
  id: string;
  label: string;
};

export const EVIDENCE_CHECKLIST_ITEMS: readonly EvidenceChecklistItem[] = [
  {
    id: "capture-caller-id",
    label:
      "Save screenshots or photos of caller ID when available (number, date, and time if shown).",
  },
  {
    id: "save-carrier-logs",
    label:
      "Export or screenshot call detail from your carrier app, online account, or phone bill.",
  },
  {
    id: "preserve-voicemail",
    label:
      "Keep voicemail messages intact; download or copy them before deleting anything from your phone.",
  },
  {
    id: "keep-written-records",
    label:
      "Write down dates, approximate times, and what was said — short notes still help.",
  },
  {
    id: "save-messages-from-caller",
    label:
      "Preserve texts or emails from the caller or campaign, if you received any.",
  },
  {
    id: "note-company-or-offer",
    label:
      "Record the company name, product, or pitch you remember (even if approximate).",
  },
];

/** Supportive framing next to the checklist (task_manager §4.2.2). */
export const CHECK_EVIDENCE_CHECKLIST_SUPPORT_COPY =
  "Stronger evidence usually supports a stronger claim. We do not guarantee any specific outcome.";
