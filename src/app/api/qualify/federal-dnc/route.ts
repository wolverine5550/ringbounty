import { type NextRequest, NextResponse } from "next/server";

import { validateFederalDncAttestation } from "@/lib/dnc/federal-dnc-attestation-gate";
import { persistFederalDncAttestation } from "@/lib/dnc/persist-federal-dnc-attestation";
import { uploadFederalDncConfirmationScreenshot } from "@/lib/dnc/upload-federal-dnc-evidence";
import { createClient } from "@/lib/supabase/server";

const SCREENSHOT_FIELD = "federal_dnc_confirmation_screenshot";

type ParsedAttestationBody = {
  claimSubjectId: string;
  federalDncRegistered: boolean | null;
  registrationDateRaw: string;
  earliestCallDate: string | null;
  screenshotFile: File | null;
};

async function parseRequestBody(
  request: NextRequest,
): Promise<ParsedAttestationBody | { error: string }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const claimSubjectId =
      typeof formData.get("claim_subject_id") === "string"
        ? String(formData.get("claim_subject_id")).trim()
        : "";
    const registeredRaw = formData.get("federal_dnc_registered");
    const federalDncRegistered =
      registeredRaw === "true"
        ? true
        : registeredRaw === "false"
          ? false
          : null;
    const registrationDateRaw =
      typeof formData.get("federal_dnc_registration_date") === "string"
        ? String(formData.get("federal_dnc_registration_date"))
        : "";
    const earliestCallDate =
      typeof formData.get("earliest_call_date") === "string"
        ? String(formData.get("earliest_call_date")).trim() || null
        : null;
    const screenshotEntry = formData.get(SCREENSHOT_FIELD);
    const screenshotFile =
      screenshotEntry instanceof File && screenshotEntry.size > 0
        ? screenshotEntry
        : null;

    return {
      claimSubjectId,
      federalDncRegistered,
      registrationDateRaw,
      earliestCallDate,
      screenshotFile,
    };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: "Invalid JSON body" };
  }

  const record = body as Record<string, unknown>;
  const claimSubjectId =
    typeof record.claim_subject_id === "string"
      ? record.claim_subject_id.trim()
      : "";
  const registeredRaw = record.federal_dnc_registered;
  const federalDncRegistered =
    registeredRaw === true ? true : registeredRaw === false ? false : null;
  const registrationDateRaw =
    typeof record.federal_dnc_registration_date === "string"
      ? record.federal_dnc_registration_date
      : "";

  return {
    claimSubjectId,
    federalDncRegistered,
    registrationDateRaw,
    earliestCallDate:
      typeof record.earliest_call_date === "string"
        ? record.earliest_call_date.trim() || null
        : null,
    screenshotFile: null,
  };
}

/**
 * Phase 6.2.1 / 6.2.4 — Persist federal DNC attestation (+ optional screenshot).
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

  const parsed = await parseRequestBody(request);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const {
    claimSubjectId,
    federalDncRegistered,
    registrationDateRaw,
    earliestCallDate,
    screenshotFile,
  } = parsed;

  if (!claimSubjectId) {
    return NextResponse.json(
      { error: "claim_subject_id is required" },
      { status: 400 },
    );
  }

  const validated = validateFederalDncAttestation({
    federalDncRegistered,
    federalDncRegistrationDate: registrationDateRaw,
  });

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { data: subject, error: subjectError } = await supabase
    .from("claim_subjects")
    .select("id, claim_id, phone_number_normalized")
    .eq("id", claimSubjectId)
    .maybeSingle();

  if (subjectError) {
    console.error("POST /api/qualify/federal-dnc subject load", subjectError);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  if (!subject?.id || !subject.claim_id || !subject.phone_number_normalized) {
    return NextResponse.json({ error: "Claim subject not found" }, { status: 404 });
  }

  let confirmationScreenshotPath: string | null = null;

  if (screenshotFile) {
    const upload = await uploadFederalDncConfirmationScreenshot(supabase, {
      userId: user.id,
      claimId: subject.claim_id,
      claimSubjectId: subject.id,
      file: screenshotFile,
    });

    if (!upload.ok) {
      return NextResponse.json({ error: upload.error }, { status: 400 });
    }

    confirmationScreenshotPath = upload.storagePath;
  }

  try {
    const result = await persistFederalDncAttestation(supabase, {
      claimId: subject.claim_id,
      claimSubjectId: subject.id,
      phoneNumberNormalized: subject.phone_number_normalized,
      attestation: validated.value,
      earliestCallDate,
      confirmationScreenshotPath,
    });

    return NextResponse.json({
      ok: true,
      federal_dnc_eligible: result.federalDncEligible,
      federal_dnc_matrix_tier: result.matrixTier,
      federal_dnc_matrix_points: result.matrixPoints,
      federal_dnc_confirmation_screenshot_path: confirmationScreenshotPath,
    });
  } catch (e) {
    console.error("POST /api/qualify/federal-dnc persist", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
