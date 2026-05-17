/**
 * Phase 13.2.4 — Transparency checklist: what RingBounty may share with attorneys.
 */

export const ATTORNEY_SHARING_CHECKLIST_HEADLINE =
  "What we may share with attorneys" as const;

export const ATTORNEY_SHARING_CHECKLIST_INTRO =
  "If you connect with an attorney, participating firms may receive a structured summary like the list below. This is for transparency only — not legal advice, and not a guarantee any attorney will contact you." as const;

export type AttorneySharingChecklistItem = {
  id: string;
  label: string;
};

/** Mirrors §13.2 evidence PDF sections (informational). */
export const ATTORNEY_SHARING_CHECKLIST_ITEMS: readonly AttorneySharingChecklistItem[] =
  [
    {
      id: "contact",
      label: "Your name, email, and state from your account",
    },
    {
      id: "strength",
      label:
        "Informational claim strength and estimated statutory value ranges (not a demand amount)",
    },
    {
      id: "qualification",
      label:
        "Your qualification answers (consent, stop requests, call patterns, DNC attestation, line type)",
    },
    {
      id: "spam-dnc",
      label: "Spam-database and do-not-call summaries for each phone number on the claim",
    },
    {
      id: "company",
      label:
        "Identified company name, registered agent details when available, and call category",
    },
    {
      id: "uploads",
      label:
        "References to files you uploaded (for example federal DNC confirmation screenshot or voicemail audio)",
    },
  ] as const;
