/** User-facing labels for attorney referral pipeline status (§13.6.2). */
export const CONSUMER_LEAD_STATUS_LABELS: Record<string, string> = {
  new: "Submitted — waiting for an attorney",
  reviewed: "Under review by an attorney",
  accepted: "An attorney accepted your referral",
  contacted: "An attorney contacted you",
  retained: "You retained an attorney",
  closed: "This referral is closed",
  declined: "No attorney match at this time",
};

export function formatConsumerLeadStatusDate(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
