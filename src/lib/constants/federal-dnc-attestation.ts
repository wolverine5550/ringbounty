/**
 * Phase 6.2 — Federal DNC via manual attestation (no National Registry API).
 *
 * Users verify status themselves at donotcall.gov (FTC confirmation email includes
 * registration date and the 31-day effective period). RingBounty stores user-stated
 * facts only (`source: user_input` on claim_events / dnc_check_results).
 */

/** Official consumer registry site (verify / register / complain). */
export const DONOTCALL_GOV_URL = "https://www.donotcall.gov";

/**
 * Shown before qualification steps that depend on DNC status — user must attest
 * explicitly; we do not auto-check the registry.
 */
export const FEDERAL_DNC_ATTESTATION_REQUIRED_MESSAGE =
  "Before continuing, confirm whether the phone number that received these calls is registered on the National Do Not Call Registry. RingBounty does not access the registry for you.";

/** Primary self-check instruction with link to FTC site. */
export const FEDERAL_DNC_SELF_CHECK_INSTRUCTIONS =
  `You can verify your registration at ${DONOTCALL_GOV_URL}. If you registered by phone or online, the FTC may email you a confirmation that includes your registration date (for example: "You successfully registered your phone number ending in … on [date]. Most telemarketers will be required to stop calling you 31 days from your registration date."). Use that date below if you have it.`;

/** Yes/No — is the consumer's number on the National DNC Registry? */
export const FEDERAL_DNC_ATTESTATION_REGISTERED_PROMPT =
  "Is the phone number that received these unwanted calls registered on the National Do Not Call Registry?";

/** Date picker label when user answers yes. */
export const FEDERAL_DNC_ATTESTATION_REGISTRATION_DATE_LABEL =
  "When did you register that number on the National Do Not Call Registry?";

/** Help text under registration date (from FTC confirmation email pattern). */
export const FEDERAL_DNC_REGISTRATION_DATE_HELP =
  "Use the date from your donotcall.gov confirmation email or your best recollection. Telemarketers generally must stop calling 31 days after that date.";

/** Shown when user has not completed required DNC attestation fields. */
export const FEDERAL_DNC_GATE_BLOCKED_MESSAGE =
  "Please confirm your National Do Not Call Registry status before continuing.";

/** When the same account already attested DNC for this phone on another claim. */
export const FEDERAL_DNC_REUSE_HEADLINE =
  "Use your saved registry answer?";

export const FEDERAL_DNC_REUSE_CONTINUE_LABEL = "Continue with saved answer";

export const FEDERAL_DNC_REUSE_ANSWER_AGAIN_LABEL =
  "Answer again for this claim";

/** Label for the spammer number screened on `/check` (not the DNC receiving line). */
export const FEDERAL_DNC_SCREENED_CALLER_LABEL =
  "Caller number you screened on RingBounty:";

/** Input label for the consumer receiving line (saved on account). */
export const FEDERAL_DNC_RECEIVING_PHONE_LABEL =
  "Your phone that received these calls (cell or home):";

export const FEDERAL_DNC_RECEIVING_PHONE_HELP =
  "We save this on your account so you do not re-enter it for each new spammer you screen.";

/** Clarifies federal DNC is about the line that received calls, not the screened caller. */
export const FEDERAL_DNC_RECEIVING_LINE_NOTE =
  "National Do Not Call Registry status applies to your receiving line below, not the caller number screened above.";

export function buildFederalDncReuseBodyWithPhone(receivingPhoneDisplay: string): string {
  return `You already confirmed National Do Not Call Registry status for ${receivingPhoneDisplay} on another claim. We can apply the same answer to this claim.`;
}

/** §6.2.4 — Optional FTC confirmation email screenshot or PDF (evidence only). */
export const FEDERAL_DNC_OPTIONAL_SCREENSHOT_COPY =
  "Optional: Upload a screenshot or PDF of your FTC donotcall.gov confirmation email (JPEG, PNG, WebP, GIF, or PDF; max 5 MB). RingBounty does not verify uploads as legal proof. Not required to continue.";

export const FEDERAL_DNC_OPTIONAL_SCREENSHOT_LABEL =
  "FTC registration confirmation (screenshot or PDF, optional)";
