"use client";

import { useCallback, useEffect, useState } from "react";

import { AccountWall } from "@/components/account-wall";
import { EmailCaptureModal } from "@/components/email-capture-modal";
import { Button } from "@/components/ui/button";
import type { EmailCaptureReason } from "@/lib/claims/email-capture-trigger";
import { RB_CHECK_SUBMITTED_EVENT } from "@/lib/check/constants";

type GateStatusResponse = {
  claim_id: string | null;
  is_successful_query: boolean;
  requires_account_wall: boolean;
  show_email_capture: boolean;
  email_capture_reason: EmailCaptureReason | null;
};

async function fetchGateStatus(): Promise<GateStatusResponse> {
  const res = await fetch("/api/claims/anonymous/status", {
    credentials: "include",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Status ${res.status}`);
  }
  return (await res.json()) as GateStatusResponse;
}

/**
 * Polls anonymous claim gate status after session bootstrap (§2.5 / §2.8).
 * Shows account wall after the one free check; optional email capture when eligible.
 */
export function CheckOutcomePanel() {
  const [status, setStatus] = useState<GateStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = await fetchGateStatus();
      setStatus(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load check status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const onSubmitted = () => {
      void refresh();
    };
    window.addEventListener(RB_CHECK_SUBMITTED_EVENT, onSubmitted);
    return () => {
      window.removeEventListener(RB_CHECK_SUBMITTED_EVENT, onSubmitted);
    };
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    fetchGateStatus()
      .then((body) => {
        if (!cancelled) {
          setStatus(body);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Could not load check status",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        Loading your check status…
      </p>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-destructive text-sm">{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!status?.claim_id) {
    return null;
  }

  if (status.requires_account_wall) {
    return (
      <AccountWall claimId={status.claim_id} returnPath="/results" />
    );
  }

  const emailReason = status.email_capture_reason;
  if (status.show_email_capture && emailReason) {
    return <EmailCaptureModal claimId={status.claim_id} reason={emailReason} />;
  }

  return null;
}
