import { type NextRequest, NextResponse } from "next/server";

import { loadQualifyPageContext } from "@/lib/qualify/load-qualify-context";
import {
  parseQualifyScreen2Body,
  persistQualifyScreen2Answers,
} from "@/lib/qualify/screen-2-stop-request";
import { createClient } from "@/lib/supabase/server";

/**
 * Phase 7.3 — Persist Screen 2 stop request answers to `claim_events` + `dnc_check_results`.
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

  const parsedAnswers = parseQualifyScreen2Body(record);
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

  const { data: subjectRow, error: subjectError } = await supabase
    .from("claim_subjects")
    .select("phone_number_normalized")
    .eq("id", claimSubjectId)
    .maybeSingle();

  if (subjectError) {
    console.error("POST /api/qualify/screen-2 subject load", subjectError);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  if (!subjectRow?.phone_number_normalized) {
    return NextResponse.json(
      { error: "Subject phone number is missing" },
      { status: 400 },
    );
  }

  try {
    await persistQualifyScreen2Answers(supabase, {
      claimId: pageContext.claim.id,
      claimSubjectId,
      phoneNumberNormalized: subjectRow.phone_number_normalized,
      answers: parsedAnswers,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/qualify/screen-2 persist", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
