import { type NextRequest, NextResponse } from "next/server";

import { loadQualifyPageContext } from "@/lib/qualify/load-qualify-context";
import {
  parseQualifyScreen5Body,
  persistQualifyScreen5Answers,
} from "@/lib/qualify/screen-5-line-type";
import { createClient } from "@/lib/supabase/server";

/**
 * Phase 7.6 — Persist Screen 5 line type attestation (`claim_events.line_type`).
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

  const parsedAnswers = parseQualifyScreen5Body(record);
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
    await persistQualifyScreen5Answers(supabase, {
      claimId: pageContext.claim.id,
      answers: parsedAnswers,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/qualify/screen-5 persist", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
