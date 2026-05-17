"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

type FirmLeadsRealtimeProps = {
  firmId: string;
};

/**
 * Phase 13.4.4 — Refresh lead list on INSERT (pool + assigned; RLS filters events).
 */
export function FirmLeadsRealtime({ firmId }: FirmLeadsRealtimeProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`firm-leads-${firmId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [firmId, router]);

  return (
    <p className="text-xs text-muted-foreground" aria-live="polite">
      Live updates enabled — new matching leads refresh automatically.
    </p>
  );
}
