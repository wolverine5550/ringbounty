/**
 * Phase 7.5 — Screen 4 company identification + evidence copy (prd.md §9 Q13–Q14).
 */

/** Voicemail gate — upload path when Yes. */
export const QUALIFY_VOICEMAIL_PROMPT =
  "Do you have a voicemail from this number you can upload?";

/** Q13 — optional company name (many callers are unknown at this stage). */
export const QUALIFY_Q13_PROMPT =
  "If you know who called, enter the company or caller name. Check your voicemail or try calling the number back.";

/** Q13 when user has no voicemail to upload — omits voicemail-specific guidance. */
export const QUALIFY_Q13_PROMPT_NO_VOICEMAIL =
  "If you know who called, enter the company or caller name (you can try calling the number back).";

export const QUALIFY_Q13_OPTIONAL_HINT =
  "Optional — leave blank if you do not know yet. You can still continue; attorney referral may require a company name later.";

/** Optional callback number from the call or voicemail. */
export const QUALIFY_Q13_CALLBACK_PROMPT =
  "Callback number mentioned (if any)";

/** Optional product / pitch context for the attorney evidence package. */
export const QUALIFY_Q13_PITCH_PROMPT =
  "What were they selling or why did they call? (optional)";

/**
 * Q14 — screenshots/notes only (voicemail is asked separately above).
 * @param hasVoicemailForUpload — user's answer to {@link QUALIFY_VOICEMAIL_PROMPT}.
 */
export function buildQualifyQ14Prompt(
  hasVoicemailForUpload: boolean | null,
): string {
  if (hasVoicemailForUpload === true) {
    return "Do you have screenshots or other notes from these calls?";
  }
  return "Do you have screenshots or notes from these calls?";
}

export const QUALIFY_Q14_UPLOAD_LABEL =
  "Upload screenshots, PDFs, or text notes (optional)";

export const QUALIFY_Q14_UPLOAD_HELP =
  "JPEG, PNG, WebP, GIF, PDF, or .txt — up to 5 MB each, 10 files total per claim. Files are stored privately on your account.";

/** Shown after successful voicemail upload before confirm. */
export const QUALIFY_VOICEMAIL_TRANSCRIPT_LABEL = "Voicemail transcript";

/** When OpenRouter is not configured. */
export const QUALIFY_VOICEMAIL_TRANSCRIPTION_UNAVAILABLE =
  "Voicemail transcription is not available right now. Enter the company name below instead.";
