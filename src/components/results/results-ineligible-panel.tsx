import { EmailCaptureModal } from "@/components/email-capture-modal";
import type { EmailCaptureReason } from "@/lib/claims/email-capture-trigger";

export type ResultsIneligiblePanelProps = {
  claimId: string;
  reasons: string[];
  showEmailCapture: boolean;
  emailCaptureReason: EmailCaptureReason | null;
};

/**
 * Phase 8.4.4 — Ineligible outcomes: reasons list + optional email capture (no attorney CTA).
 */
export function ResultsIneligiblePanel({
  claimId,
  reasons,
  showEmailCapture,
  emailCaptureReason,
}: ResultsIneligiblePanelProps) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <div>
        <h2 className="text-sm font-medium">Why attorney referral is not available</h2>
        <ul className="text-muted-foreground mt-2 list-inside list-disc text-sm">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>

      {showEmailCapture && emailCaptureReason ? (
        <EmailCaptureModal claimId={claimId} reason={emailCaptureReason} />
      ) : null}
    </section>
  );
}
