import { type NextRequest, NextResponse } from "next/server";

import { loadQualifyPageContext } from "@/lib/qualify/load-qualify-context";
import {
  parseQualifyScreen1Body,
  persistQualifyScreen1Answers,
} from "@/lib/qualify/screen-1-consent";
import { createClient } from "@/lib/supabase/server";

/**
 * Phase 7.2 — Persist Screen 1 consent / EBR answers to `claim_events`.
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

  const parsedAnswers = parseQualifyScreen1Body(record);
  if ("error" in parsedAnswers) {
    return NextResponse.json({ error: parsedAnswers.error }, { status: 400 });
  }

  const pageContext = await loadQualifyPageContext(supabase, {
    claimSubjectId,
    userId: user.id,
  });

  if (!pageContext) {
    return NextResponse.json({ error: "Claim subject not found" }, { status: 404 });
  }

  try {
    const result = await persistQualifyScreen1Answers(supabase, {
      claimId: pageContext.claim.id,
      answers: parsedAnswers,
    });

    return NextResponse.json({
      ok: true,
      show_ebr_explainer: result.showEbrExplainer,
    });
  } catch (e) {
    console.error("POST /api/qualify/screen-1 persist", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
