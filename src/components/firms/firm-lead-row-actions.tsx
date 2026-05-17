"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FirmLeadRowActionsProps = {
  leadId: string;
  isPool: boolean;
  status: string;
  leadFeeCents: number | null;
  stripeChargesEnabled: boolean;
};

function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * §13.5 — Accept (Stripe Checkout) and decline actions for pool leads.
 */
export function FirmLeadRowActions({
  leadId,
  isPool,
  status,
  leadFeeCents,
  stripeChargesEnabled,
}: FirmLeadRowActionsProps) {
  const router = useRouter();
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<"accept" | "decline" | null>(null);

  if (!isPool || !["new", "reviewed"].includes(status)) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
      {!declineOpen ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            size="sm"
            disabled={isLoading !== null || !stripeChargesEnabled}
            title={
              stripeChargesEnabled
                ? undefined
                : "Complete Stripe Connect setup before accepting leads"
            }
            onClick={async () => {
              setIsLoading("accept");
              setError(null);
              try {
                const res = await fetch(`/api/firms/leads/${leadId}/accept`, {
                  method: "POST",
                });
                const body = (await res.json()) as {
                  checkout_url?: string;
                  error?: string;
                };
                if (!res.ok || !body.checkout_url) {
                  throw new Error(body.error ?? "Could not start payment");
                }
                window.location.href = body.checkout_url;
              } catch (e) {
                setError(e instanceof Error ? e.message : "Something went wrong");
                setIsLoading(null);
              }
            }}
          >
            {isLoading === "accept"
              ? "Opening checkout…"
              : leadFeeCents != null
                ? `Accept (${formatUsd(leadFeeCents)})`
                : "Accept"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isLoading !== null}
            onClick={() => setDeclineOpen(true)}
          >
            Decline
          </Button>
        </div>
      ) : (
        <div className="flex w-full max-w-xs flex-col gap-2">
          <Input
            placeholder="Optional reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isLoading !== null}
              onClick={() => {
                setDeclineOpen(false);
                setReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isLoading !== null}
              onClick={async () => {
                setIsLoading("decline");
                setError(null);
                try {
                  const res = await fetch(`/api/firms/leads/${leadId}/decline`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason: reason.trim() || undefined }),
                  });
                  const body = (await res.json()) as { error?: string };
                  if (!res.ok) {
                    throw new Error(body.error ?? "Could not decline lead");
                  }
                  router.refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Something went wrong");
                } finally {
                  setIsLoading(null);
                }
              }}
            >
              {isLoading === "decline" ? "Declining…" : "Confirm decline"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
