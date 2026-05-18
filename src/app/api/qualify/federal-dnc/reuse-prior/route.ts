import { type NextRequest, NextResponse } from "next/server";

import { loadPriorFederalDncAttestationForUser } from "@/lib/dnc/load-prior-federal-dnc-attestation";
import { reuseFederalDncAttestationFromPrior } from "@/lib/dnc/reuse-federal-dnc-attestation-from-prior";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  loadUserReceivingPhone,
  parseReceivingPhoneInput,
  persistUserReceivingPhone,
} from "@/lib/users/receiving-phone";

/**
 * Apply a prior federal DNC attestation (same account) to this claim subject.
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

  const record =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};
  const claimSubjectId =
    typeof record.claim_subject_id === "string"
      ? record.claim_subject_id.trim()
      : "";
  const receivingPhoneRaw =
    typeof record.receiving_phone === "string"
      ? record.receiving_phone.trim()
      : "";

  if (!claimSubjectId) {
    return NextResponse.json(
      { error: "claim_subject_id is required" },
      { status: 400 },
    );
  }

  const { data: subject, error: subjectError } = await supabase
    .from("claim_subjects")
    .select("id, claim_id, phone_number_normalized")
    .eq("id", claimSubjectId)
    .maybeSingle();

  if (subjectError) {
    console.error("POST federal-dnc/reuse-prior subject", subjectError);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  if (!subject?.id || !subject.claim_id || !subject.phone_number_normalized) {
    return NextResponse.json({ error: "Claim subject not found" }, { status: 404 });
  }

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("user_id")
    .eq("id", subject.claim_id)
    .maybeSingle();

  if (claimError) {
    console.error("POST federal-dnc/reuse-prior claim", claimError);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  if (claim?.user_id !== user.id) {
    return NextResponse.json({ error: "Claim subject not found" }, { status: 404 });
  }

  let receivingPhone = await loadUserReceivingPhone(supabase, user.id);
  if (receivingPhoneRaw) {
    const parsedReceiving = parseReceivingPhoneInput(receivingPhoneRaw);
    if (!parsedReceiving.ok) {
      return NextResponse.json({ error: parsedReceiving.error }, { status: 400 });
    }
    receivingPhone = parsedReceiving.value;
    await persistUserReceivingPhone(supabase, {
      userId: user.id,
      phone: receivingPhone,
    });
  }

  const prior = await loadPriorFederalDncAttestationForUser(supabase, {
    userId: user.id,
    excludeClaimSubjectId: subject.id,
  });

  if (!prior) {
    return NextResponse.json(
      { error: "No saved registry answer on your account yet." },
      { status: 404 },
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("state")
    .eq("id", user.id)
    .maybeSingle();

  try {
    const admin = createAdminClient();
    const result = await reuseFederalDncAttestationFromPrior({
      userClient: supabase,
      adminClient: admin,
      userId: user.id,
      claimId: subject.claim_id,
      claimSubjectId: subject.id,
      phoneNumberNormalized: subject.phone_number_normalized,
      userState: profile?.state ?? null,
      prior,
    });

    return NextResponse.json({
      ok: true,
      reused: true,
      federal_dnc_eligible: result.federalDncEligible,
      receiving_phone: receivingPhone?.display ?? null,
    });
  } catch (e) {
    console.error("POST federal-dnc/reuse-prior", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
