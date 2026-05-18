import {
  CONSUMER_LEAD_STATUS_LABELS,
  formatConsumerLeadStatusDate,
} from "@/lib/constants/consumer-lead-status";
import type { ConsumerLeadStatus } from "@/lib/leads/load-consumer-lead-status";

type AttorneyLeadStatusPanelProps = {
  lead: ConsumerLeadStatus;
};

/**
 * §13.6.2 — Consumer visibility for attorney referral pipeline status on `/results`.
 */
export function AttorneyLeadStatusPanel({ lead }: AttorneyLeadStatusPanelProps) {
  const label =
    CONSUMER_LEAD_STATUS_LABELS[lead.status] ??
    `Referral status: ${lead.status}`;

  const milestone =
    lead.closedAt ??
    lead.retainedAt ??
    lead.contactedAt ??
    lead.acceptedAt;
  const milestoneLabel = lead.closedAt
    ? "Closed"
    : lead.retainedAt
      ? "Retained"
      : lead.contactedAt
        ? "Contacted"
        : lead.acceptedAt
          ? "Accepted"
          : null;

  return (
    <section
      className="rounded-lg border bg-muted/30 p-4 text-sm"
      aria-labelledby="attorney-lead-status-heading"
    >
      <h2 id="attorney-lead-status-heading" className="font-medium">
        Attorney referral status
      </h2>
      <p className="mt-2 text-muted-foreground leading-relaxed">{label}</p>
      {milestone && milestoneLabel ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {milestoneLabel}: {formatConsumerLeadStatusDate(milestone)}
        </p>
      ) : null}
    </section>
  );
}
