"use client";

import { useCallback, useId, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmailCaptureReason } from "@/lib/claims/email-capture-trigger";
import {
  MARKETING_CONSENT_FOOTNOTE,
  MARKETING_CONSENT_LABEL,
  type WaitlistSource,
} from "@/lib/waitlist/constants";

type EmailCaptureModalProps = {
  claimId?: string | null;
  reason: EmailCaptureReason | "notify_me_cta";
  /** When true, renders as an overlay dialog; otherwise inline card. */
  asOverlay?: boolean;
  onClose?: () => void;
};

function reasonToSource(reason: EmailCaptureModalProps["reason"]): WaitlistSource {
  if (reason === "notify_me_cta") {
    return "notify_me_cta";
  }
  return reason;
}

function titleForReason(reason: EmailCaptureModalProps["reason"]): string {
  switch (reason) {
    case "ineligible_check":
      return "This number is not eligible right now";
    case "exempt_only":
      return "These calls may be exempt";
    case "notify_me_cta":
      return "Get notified";
    default:
      return "Stay in touch";
  }
}

function descriptionForReason(reason: EmailCaptureModalProps["reason"]): string {
  switch (reason) {
    case "ineligible_check":
      return "Leave your email and we will let you know if eligibility rules change or new options become available.";
    case "exempt_only":
      return "Exempt callers are not covered by this TCPA path. We can email you if we add support for other violation types.";
    case "notify_me_cta":
      return "Tell us where to reach you when we expand coverage or launch new tools.";
    default:
      return "Share your email for occasional updates.";
  }
}

/**
 * Email capture form (§2.8.1) — modal overlay or inline card.
 */
export function EmailCaptureModal({
  claimId,
  reason,
  asOverlay = false,
  onClose,
}: EmailCaptureModalProps) {
  const formId = useId();
  const emailId = `${formId}-email`;
  const consentId = `${formId}-consent`;

  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          marketing_consent: marketingConsent,
          source: reasonToSource(reason),
          claim_id: claimId ?? undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setError(body.error ?? `Request failed (${res.status})`);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Could not save your email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [claimId, email, marketingConsent, reason]);

  const card = (
    <Card className={asOverlay ? "w-full max-w-md shadow-lg" : "border-dashed"}>
      <CardHeader>
        <CardTitle className="text-lg">{titleForReason(reason)}</CardTitle>
        <CardDescription>{descriptionForReason(reason)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {success ? (
          <p className="text-success text-sm" role="status">
            Thanks — we saved your email.
          </p>
        ) : (
          <>
            <div className="grid gap-2">
              <Label htmlFor={emailId}>Email</Label>
              <Input
                id={emailId}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id={consentId}
                checked={marketingConsent}
                onCheckedChange={(v) => setMarketingConsent(v === true)}
              />
              <div className="grid gap-1">
                <Label htmlFor={consentId} className="text-sm font-normal leading-snug">
                  {MARKETING_CONSENT_LABEL}
                </Label>
                <p className="text-muted-foreground text-xs">
                  {MARKETING_CONSENT_FOOTNOTE}
                </p>
              </div>
            </div>
            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={submitting} onClick={() => void submit()}>
                {submitting ? "Saving…" : "Notify me"}
              </Button>
              {onClose ? (
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  Not now
                </Button>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  if (!asOverlay) {
    return card;
  }

  return <CaptureOverlay onClose={onClose}>{card}</CaptureOverlay>;
}

function CaptureOverlay({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape" && onClose) {
          onClose();
        }
      }}
    >
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
