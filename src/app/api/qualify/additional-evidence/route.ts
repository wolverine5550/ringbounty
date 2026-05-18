import { type NextRequest, NextResponse } from "next/server";

import {
  ADDITIONAL_CALL_EVIDENCE_MAX_FILES,
  ADDITIONAL_EVIDENCE_PATHS_EVENT_KEY,
  parseAdditionalEvidencePathsEventValue,
} from "@/lib/qualify/additional-call-evidence";
import { uploadAdditionalCallEvidenceFiles } from "@/lib/qualify/upload-additional-call-evidence";
import { loadQualifyPageContext } from "@/lib/qualify/load-qualify-context";
import { createClient } from "@/lib/supabase/server";

const FILE_FIELD = "additional_evidence_files";

/**
 * Phase 7.5 — Upload Q14 screenshots / PDFs / notes to `claim-evidence` Storage.
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

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "multipart/form-data required" },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const claimSubjectId =
    typeof formData.get("claim_subject_id") === "string"
      ? String(formData.get("claim_subject_id")).trim()
      : "";

  if (!claimSubjectId) {
    return NextResponse.json(
      { error: "claim_subject_id is required" },
      { status: 400 },
    );
  }

  const files = formData
    .getAll(FILE_FIELD)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return NextResponse.json(
      { error: "At least one file is required." },
      { status: 400 },
    );
  }

  if (files.length > ADDITIONAL_CALL_EVIDENCE_MAX_FILES) {
    return NextResponse.json(
      {
        error: `You can upload up to ${ADDITIONAL_CALL_EVIDENCE_MAX_FILES} files at a time.`,
      },
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

  const upload = await uploadAdditionalCallEvidenceFiles(supabase, {
    userId: user.id,
    claimId: pageContext.claim.id,
    claimSubjectId,
    files,
  });

  if (!upload.ok) {
    return NextResponse.json({ error: upload.error }, { status: 400 });
  }

  const { data: priorEvents } = await supabase
    .from("claim_events")
    .select("value")
    .eq("claim_id", pageContext.claim.id)
    .eq("event_type", "qualification_answer")
    .eq("key", ADDITIONAL_EVIDENCE_PATHS_EVENT_KEY)
    .order("created_at", { ascending: false })
    .limit(1);

  const existing = parseAdditionalEvidencePathsEventValue(
    priorEvents?.[0]?.value ?? null,
  );
  const merged = [...existing, ...upload.storagePaths].slice(
    0,
    ADDITIONAL_CALL_EVIDENCE_MAX_FILES,
  );

  const { error: eventError } = await supabase.from("claim_events").insert({
    claim_id: pageContext.claim.id,
    event_type: "qualification_answer",
    key: ADDITIONAL_EVIDENCE_PATHS_EVENT_KEY,
    value: JSON.stringify(merged),
    source: "user_input",
  });

  if (eventError) {
    console.error("POST additional-evidence claim_events", eventError);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    storage_paths: merged,
    uploaded_count: upload.storagePaths.length,
  });
}
