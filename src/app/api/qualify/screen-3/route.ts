import { type NextRequest, NextResponse } from "next/server";

import { loadQualifyPageContext } from "@/lib/qualify/load-qualify-context";
import {
  parseQualifyScreen3Body,
  persistQualifyScreen3Answers,
} from "@/lib/qualify/screen-3-call-details";
import { createClient } from "@/lib/supabase/server";

/**
 * Phase 7.4 — Persist Screen 3 call details to `claim_events` + recompute federal DNC.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const claimSubjectId =
    typeof record.claim_subject_id === "string"
      ? record.claim_subject_id.trim()
      : "";

  if (!claimSubjectId) {
    return NextResponse.json(
      { error: "claim_subject_id is required" },
      { status: 400 },
    );
  }

  const pageContext = await loadQualifyPageContext(supabase, {
    claimSubjectId,
    userId: user.id,
  });

  if (!pageContext) {
    return NextResponse.json({ error: "Claim subject not found" }, { status: 404 });
  }

  const parsedAnswers = await parseQualifyScreen3Body(
    supabase,
    pageContext.claim.id,
    record,
  );
  if ("error" in parsedAnswers) {
    return NextResponse.json({ error: parsedAnswers.error }, { status: 400 });
  }

  try {
    const result = await persistQualifyScreen3Answers(supabase, {
      claimId: pageContext.claim.id,
      claimSubjectId,
      answers: parsedAnswers,
    });

    return NextResponse.json({
      ok: true,
      federal_dnc_eligible: result.federalDncEligible,
    });
  } catch (e) {
    console.error("POST /api/qualify/screen-3 persist", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
