/**
 * Phase 13.1.2 — Expectation screen copy (informational; not legal advice).
 */

/** Target response window shown to consumers (not a guarantee). */
export const ATTORNEY_REFERRAL_CONTACT_WINDOW =
  "Participating attorneys may contact you within about 48 hours if they want to review your claim. Timing varies — RingBounty does not guarantee a response." as const;

/** Informational contingency framing (PRD; not a fee quote). */
export const ATTORNEY_REFERRAL_CONTINGENCY_INFO =
  "Many consumer attorneys handle TCPA cases on a contingency basis, which often means you may not pay hourly fees up front. Fee arrangements vary by attorney and state. RingBounty does not set fees or take a percentage of any recovery." as const;

export const ATTORNEY_REFERRAL_NO_REPRESENTATION =
  "RingBounty is not a law firm, does not provide legal advice, and does not guarantee that any attorney will accept your case or contact you." as const;

/** Checkbox — authorize sharing claim data with participating firms (§Open questions). */
export const ATTORNEY_REFERRAL_CONSENT_SHARE_LABEL =
  "I authorize RingBounty to share my claim information, qualification answers, and contact details with participating law firms so they can review whether they can help." as const;

/** Checkbox — informational acknowledgement before submit. */
export const ATTORNEY_REFERRAL_CONSENT_ACK_LABEL =
  "I understand this is general information only, not legal advice, and that RingBounty does not guarantee representation or any outcome." as const;

export const ATTORNEY_REFERRAL_SUBMIT_LABEL = "Submit for attorney review" as const;

export const ATTORNEY_REFERRAL_SUCCESS_HEADLINE =
  "Your request was submitted" as const;

export const ATTORNEY_REFERRAL_SUCCESS_BODY =
  "We saved your request and will share your evidence summary with participating attorneys. Check your email for a confirmation. If an attorney is interested, they may reach out within about 48 hours." as const;
