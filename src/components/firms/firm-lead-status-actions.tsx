"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type FirmLeadStatusActionsProps = {
  leadId: string;
  status: string;
  isAssigned: boolean;
};

const NEXT_STATUS: Record<string, { target: string; label: string }[]> = {
  accepted: [
    { target: "contacted", label: "Mark contacted" },
    { target: "closed", label: "Mark closed" },
  ],
  contacted: [
    { target: "retained", label: "Mark retained" },
    { target: "closed", label: "Mark closed" },
  ],
  retained: [{ target: "closed", label: "Mark closed" }],
};

/**
 * §13.6.1 — Pipeline status buttons for assigned accepted+ leads.
 */
export function FirmLeadStatusActions({
  leadId,
  status,
  isAssigned,
}: FirmLeadStatusActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loadingTarget, setLoadingTarget] = useState<string | null>(null);

  const actions = NEXT_STATUS[status];
  if (!isAssigned || !actions?.length) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-1">
        {actions.map((action) => (
          <Button
            key={action.target}
            type="button"
            size="sm"
            variant={action.target === "closed" ? "outline" : "secondary"}
            disabled={loadingTarget !== null}
            onClick={async () => {
              setLoadingTarget(action.target);
              setError(null);
              try {
                const res = await fetch(`/api/firms/leads/${leadId}/status`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: action.target }),
                });
                const body = (await res.json()) as { error?: string };
                if (!res.ok) {
                  throw new Error(body.error ?? "Could not update status");
                }
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Something went wrong");
              } finally {
                setLoadingTarget(null);
              }
            }}
          >
            {loadingTarget === action.target ? "Saving…" : action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
