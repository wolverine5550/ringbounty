"use client";

import { useCallback, useEffect, useState } from "react";

import type { QualifyCompanyIntelSnapshot } from "./load-qualify-company-intel";

/** CI-8.2.4 — Poll interval while Lane B is pending or running. */
export const QUALIFY_COMPANY_INTEL_POLL_MS = 3000;

const COMPANY_INTEL_API_PATH = "/api/qualify/company-intel";

/** True when Screen 4 should keep polling the suggest API. */
export function shouldPollQualifyCompanyIntel(
  status: QualifyCompanyIntelSnapshot["status"],
): boolean {
  return status === "pending" || status === "running";
}

async function fetchQualifyCompanyIntelSnapshot(
  claimSubjectId: string,
): Promise<QualifyCompanyIntelSnapshot | null> {
  const url = `${COMPANY_INTEL_API_PATH}?claimSubjectId=${encodeURIComponent(claimSubjectId)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as QualifyCompanyIntelSnapshot;
}

/**
 * CI-8.2.4 — Polls `GET /api/qualify/company-intel` every 3s while status is `pending` | `running`.
 * Mount only on Qualify Screen 4 (wizard step 4).
 */
export function useQualifyCompanyIntelPoll(
  claimSubjectId: string,
  initialSnapshot: QualifyCompanyIntelSnapshot | null,
) {
  const [snapshot, setSnapshot] = useState<QualifyCompanyIntelSnapshot | null>(
    initialSnapshot,
  );
  const [trackedSubjectId, setTrackedSubjectId] = useState(claimSubjectId);

  // Reset snapshot when navigating to a different subject (avoid setState in useEffect).
  if (claimSubjectId !== trackedSubjectId) {
    setTrackedSubjectId(claimSubjectId);
    setSnapshot(initialSnapshot);
  }

  const refresh = useCallback(async () => {
    const body = await fetchQualifyCompanyIntelSnapshot(claimSubjectId);
    if (body) {
      setSnapshot(body);
    }
    return body;
  }, [claimSubjectId]);

  useEffect(() => {
    if (!shouldPollQualifyCompanyIntel(snapshot?.status ?? null)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refresh();
    }, QUALIFY_COMPANY_INTEL_POLL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [snapshot?.status, refresh]);

  return { snapshot, refresh };
}
