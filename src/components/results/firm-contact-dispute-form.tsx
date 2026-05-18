"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  FIRM_CONTACT_DISPUTE_FORM_INTRO,
  FIRM_CONTACT_DISPUTE_FORM_TITLE,
  FIRM_CONTACT_DISPUTE_REASON_LABELS,
  FIRM_CONTACT_DISPUTE_REASONS,
  FIRM_CONTACT_DISPUTE_SUBMIT_LABEL,
  FIRM_CONTACT_DISPUTE_SUCCESS_MESSAGE,
  type FirmContactDisputeReason,
} from "@/lib/constants/firm-contact-dispute";

export type FirmContactDisputeFormProps = {
  leadId: string;
  /** When true, show confirmation only (already filed). */
  alreadySubmitted: boolean;
};

/**
 * §13.8.1 — In-app form for consumers to report firm contact issues.
 */
export function FirmContactDisputeForm({
  leadId,
  alreadySubmitted: initialSubmitted,
}: FirmContactDisputeFormProps) {
  const router = useRouter();
  const [reason, setReason] = useState<FirmContactDisputeReason>("no_contact");
  const [details, setDetails] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(initialSubmitted);

  if (submitted) {
    return (
      <section
        className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm"
        aria-live="polite"
      >
        <p className="text-muted-foreground leading-relaxed">
          {FIRM_CONTACT_DISPUTE_SUCCESS_MESSAGE}
        </p>
      </section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/leads/${leadId}/firm-contact-dispute`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          details: details.trim() || undefined,
        }),
      });

      const body = (await res.json()) as { error?: string };

      if (!res.ok) {
        if (body.error === "already_submitted") {
          setSubmitted(true);
          router.refresh();
          return;
        }
        setSubmitError(body.error ?? "Could not submit your report.");
        return;
      }

      setSubmitted(true);
      router.refresh();
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className="rounded-lg border p-4 text-sm"
      aria-labelledby="firm-contact-dispute-heading"
    >
      <h2 id="firm-contact-dispute-heading" className="font-medium">
        {FIRM_CONTACT_DISPUTE_FORM_TITLE}
      </h2>
      <p className="mt-2 text-muted-foreground leading-relaxed">
        {FIRM_CONTACT_DISPUTE_FORM_INTRO}
      </p>

      <form className="mt-4 flex flex-col gap-4" onSubmit={(ev) => void handleSubmit(ev)}>
        <div className="grid gap-2">
          <Label htmlFor="firm-dispute-reason">What happened?</Label>
          <select
            id="firm-dispute-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as FirmContactDisputeReason)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            {FIRM_CONTACT_DISPUTE_REASONS.map((value) => (
              <option key={value} value={value}>
                {FIRM_CONTACT_DISPUTE_REASON_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="firm-dispute-details">Additional details (optional)</Label>
          <textarea
            id="firm-dispute-details"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Optional"
          />
        </div>

        {submitError ? (
          <p className="text-destructive text-sm" role="alert">
            {submitError}
          </p>
        ) : null}

        <Button type="submit" variant="outline" disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : FIRM_CONTACT_DISPUTE_SUBMIT_LABEL}
        </Button>
      </form>
    </section>
  );
}
