import type { ClaimQuerySnapshot } from "./successful-query";

/** Reasons the email-capture UI may appear (§2.8.4). */
export const EMAIL_CAPTURE_REASONS = [
  "ineligible_check",
  "exempt_only",
] as const;

export type EmailCaptureReason = (typeof EMAIL_CAPTURE_REASONS)[number];

export type EmailCaptureTrigger = {
  showEmailCapture: boolean;
  emailCaptureReason: EmailCaptureReason | null;
};

/**
 * Determines whether to offer email capture for ineligible / exempt-only outcomes.
 * Does not include `notify_me_cta` — that is an explicit user action in the UI.
 */
export function getEmailCaptureTrigger(
  snapshot: ClaimQuerySnapshot,
): EmailCaptureTrigger {
  if (snapshot.claim.claim_strength === "ineligible") {
    return {
      showEmailCapture: true,
      emailCaptureReason: "ineligible_check",
    };
  }

  const subjects = snapshot.subjects;
  if (
    subjects.length > 0 &&
    subjects.every((row) => row.is_exempt)
  ) {
    return {
      showEmailCapture: true,
      emailCaptureReason: "exempt_only",
    };
  }

  return {
    showEmailCapture: false,
    emailCaptureReason: null,
  };
}
