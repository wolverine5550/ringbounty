"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function FirmStripeOnboardingButton() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-3">
      <Button
        type="button"
        disabled={isLoading}
        onClick={async () => {
          setIsLoading(true);
          setError(null);
          try {
            const res = await fetch("/api/firms/stripe-connect/onboarding", {
              method: "POST",
            });
            const body = (await res.json()) as { url?: string; error?: string };
            if (!res.ok || !body.url) {
              throw new Error(body.error ?? "Could not start Stripe onboarding");
            }
            window.location.href = body.url;
          } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
            setIsLoading(false);
          }
        }}
      >
        {isLoading ? "Opening Stripe…" : "Continue Stripe setup"}
      </Button>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
