import { type NextRequest, NextResponse } from "next/server";

import { loadQualifyPageContext } from "@/lib/qualify/load-qualify-context";
import {
  parseQualifyScreen4Body,
  persistQualifyScreen4Answers,
} from "@/lib/qualify/screen-4-company-identification";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Phase 7.5 — Persist Screen 4 Q13/Q14 (company + evidence flag).
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

  const parsedAnswers = parseQualifyScreen4Body(record);
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

  const skipUserCompanyPersist =
    record.skip_user_company_persist === true ||
    record.identification_source === "voicemail_transcription";

  const { data: profile } = await supabase
    .from("users")
    .select("state")
    .eq("id", user.id)
    .maybeSingle();

  try {
    const admin = createAdminClient();
    const result = await persistQualifyScreen4Answers(admin, {
      claimId: pageContext.claim.id,
      claimSubjectId,
      userStateCode: profile?.state ?? null,
      answers: parsedAnswers,
      skipUserCompanyPersist,
    });

    return NextResponse.json({
      ok: true,
      show_unverified_warning: result.showUnverifiedWarning,
      verification_status: result.verificationStatus,
    });
  } catch (e) {
    console.error("POST /api/qualify/screen-4 persist", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
