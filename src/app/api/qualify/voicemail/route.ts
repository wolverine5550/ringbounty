import { type NextRequest, NextResponse } from "next/server";

import {
  extractCompanyFromVoicemailTranscript,
  transcribeVoicemailWithOpenRouter,
} from "@/lib/company/openrouter-voicemail";
import { persistVoicemailCompanyIdentification } from "@/lib/company/persist-voicemail-company-identification";
import { uploadVoicemailAudio } from "@/lib/company/upload-voicemail-evidence";
import { loadQualifyPageContext } from "@/lib/qualify/load-qualify-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const VOICEMAIL_FIELD = "voicemail_audio";

/**
 * Phase 7.5.4 — Upload voicemail, transcribe, extract company, persist when found.
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

  const audioEntry = formData.get(VOICEMAIL_FIELD);
  if (!(audioEntry instanceof File) || audioEntry.size <= 0) {
    return NextResponse.json(
      { error: "voicemail_audio file is required" },
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

  const upload = await uploadVoicemailAudio(supabase, {
    userId: user.id,
    claimId: pageContext.claim.id,
    claimSubjectId,
    file: audioEntry,
  });

  if (!upload.ok) {
    return NextResponse.json({ error: upload.error }, { status: 400 });
  }

  const bytes = await audioEntry.arrayBuffer();
  const base64Audio = Buffer.from(bytes).toString("base64");

  const transcription = await transcribeVoicemailWithOpenRouter({
    base64Audio,
    format: upload.openRouterFormat,
  });

  if (!transcription.ok) {
    return NextResponse.json({
      ok: true,
      storage_path: upload.storagePath,
      transcription_available: false,
      transcription_error: transcription.error,
      transcript: null,
      company_name: null,
      callback_phone: null,
      product_pitch: null,
      company_identified: false,
    });
  }

  const extraction = await extractCompanyFromVoicemailTranscript(
    transcription.text,
  );

  const extracted = extraction.ok ? extraction.value : null;

  const { data: profile } = await supabase
    .from("users")
    .select("state")
    .eq("id", user.id)
    .maybeSingle();

  let persistResult: {
    verificationStatus: string | null;
    showUnverifiedWarning: boolean;
  } | null = null;

  if (extracted?.companyName) {
    try {
      const admin = createAdminClient();
      persistResult = await persistVoicemailCompanyIdentification(admin, {
        claimId: pageContext.claim.id,
        claimSubjectId,
        companyName: extracted.companyName,
        transcript: transcription.text,
        voicemailStoragePath: upload.storagePath,
        callbackPhone: extracted.callbackPhone,
        productPitch: extracted.productPitch,
        userStateCode: profile?.state ?? null,
      });
    } catch (e) {
      console.error("POST /api/qualify/voicemail persist", e);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    storage_path: upload.storagePath,
    transcription_available: true,
    transcript: transcription.text,
    company_name: extracted?.companyName ?? null,
    callback_phone: extracted?.callbackPhone ?? null,
    product_pitch: extracted?.productPitch ?? null,
    company_identified: Boolean(extracted?.companyName && persistResult),
    verification_status: persistResult?.verificationStatus ?? null,
    show_unverified_warning: persistResult?.showUnverifiedWarning ?? false,
    extraction_error: extraction.ok ? null : extraction.error,
  });
}
