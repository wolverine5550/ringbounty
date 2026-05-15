"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AccountWall } from "@/components/account-wall";
import { Button } from "@/components/ui/button";

type GateStatusResponse = {
  claim_id: string | null;
  is_successful_query: boolean;
  requires_account_wall: boolean;
};

type CheckOutcomePanelProps = {
  /** When true, show gentle copy encouraging another number (§2.5.3). */
  showRetryHint?: boolean;
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
 * Polls anonymous claim gate status after session bootstrap (§2.5 / §2.5.3).
 * Full phone-check UI arrives in Phase 4; this panel wires the account wall now.
 */
export function CheckOutcomePanel({ showRetryHint }: CheckOutcomePanelProps) {
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

  // Initial load: setState only in fetch callbacks (not synchronously in the effect body).
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
    return (
      <p className="text-muted-foreground text-sm">
        Your anonymous session is ready. The full number-check flow will appear here in a
        later release.
      </p>
    );
  }

  if (status.requires_account_wall) {
    return (
      <AccountWall claimId={status.claim_id} returnPath="/results" />
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-dashed p-4">
      <p className="text-sm">
        {showRetryHint
          ? "This number does not look like a claim yet. You can try another number without signing in."
          : "No account is required yet for this check. When we find a potential claim, you will be asked to sign in to continue."}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh status
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href="/check">Check another number</Link>
        </Button>
      </div>
    </div>
  );
}
