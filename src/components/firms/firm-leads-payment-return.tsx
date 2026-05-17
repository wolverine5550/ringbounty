"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Handles Stripe Checkout return query params on `/firms/leads` (§13.5.1).
 */
export function FirmLeadsPaymentReturn() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handled = useRef(false);

  const payment = searchParams.get("payment");
  const leadId = searchParams.get("lead_id")?.trim() ?? null;

  useEffect(() => {
    if (handled.current || !payment || !leadId) {
      return;
    }

    handled.current = true;

    const run = async () => {
      if (payment === "cancelled") {
        await fetch(`/api/firms/leads/${leadId}/release-payment`, {
          method: "POST",
        });
      }
      router.replace("/firms/leads");
      router.refresh();
    };

    void run();
  }, [payment, leadId, router]);

  if (payment === "success") {
    return (
      <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-100">
        Payment received — consumer contact details unlock when Stripe confirms
        the charge (usually within a few seconds).
      </p>
    );
  }

  return null;
}
