/**
 * User-facing claim status labels (distinct from `claims.status` DB values).
 *
 * `checking` means numbers were screened and qualify is not finished — not that
 * Nomorobo/Twilio are still in flight.
 */

/** Statuses where the consumer can still complete the qualify wizard. */
export const CLAIM_STATUSES_PENDING_QUALIFICATION = ["draft", "checking"] as const;

export type ClaimStatusPendingQualification =
  (typeof CLAIM_STATUSES_PENDING_QUALIFICATION)[number];

export function isClaimPendingQualification(
  status: string,
): status is ClaimStatusPendingQualification {
  return (CLAIM_STATUSES_PENDING_QUALIFICATION as readonly string[]).includes(
    status,
  );
}

/** Short label for dashboard / list rows. */
export function getClaimStatusDisplayLabel(status: string): string {
  switch (status) {
    case "draft":
      return "In progress";
    case "checking":
      return "Ready to qualify";
    case "qualified":
      return "Qualified";
    case "referred":
      return "Referred";
    case "letter_purchased":
      return "Letter purchased";
    case "letter_generated":
      return "Letter generated";
    case "attorney_contacted":
      return "Attorney contacted";
    case "retained":
      return "Retained";
    case "closed":
      return "Closed";
    default:
      return status.replaceAll("_", " ");
  }
}
