/**
 * Phase 7.5 — Screen 4 company identification + evidence copy (prd.md §9 Q13–Q14).
 */

/** Voicemail gate — upload path when Yes. */
export const QUALIFY_VOICEMAIL_PROMPT =
  "Do you have a voicemail from this number you can upload?";

/** Q13 — company name when voicemail missing or extraction failed. */
export const QUALIFY_Q13_PROMPT =
  "Do you know the name of this company? Check your voicemail or try calling the number back.";

/** Optional callback number from the call or voicemail. */
export const QUALIFY_Q13_CALLBACK_PROMPT =
  "Callback number mentioned (if any)";

/** Optional product / pitch context for the attorney evidence package. */
export const QUALIFY_Q13_PITCH_PROMPT =
  "What were they selling or why did they call? (optional)";

/** Q14 — non-blocking evidence flag for §13.2 PDF. */
export const QUALIFY_Q14_PROMPT =
  "Do you have any voicemails, screenshots, or notes from these calls?";

/** Shown after successful voicemail upload before confirm. */
export const QUALIFY_VOICEMAIL_TRANSCRIPT_LABEL = "Voicemail transcript";

/** When OpenRouter is not configured. */
export const QUALIFY_VOICEMAIL_TRANSCRIPTION_UNAVAILABLE =
  "Voicemail transcription is not available right now. Enter the company name below instead.";
