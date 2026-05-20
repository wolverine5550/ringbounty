/**
 * CI-8.5 — Seeds two UNKNOWN claim subjects at Qualify step 4 via service role.
 */

import { createClient } from "@supabase/supabase-js";

import { QUALIFY_STEP_RESUME_EVENT_KEY } from "@/lib/qualify/constants";
import type { Database } from "@/types/database";

import { getE2EUserEmail, getSupabaseAdminKey } from "./env";
import type { QualifyScreen4E2EFixture } from "./qualify-screen-4-fixture";

const VIOLATION_TYPE_ID = "tcpa";
const E2E_POLL_PHONE = { display: "(555) 010-CI85A", normalized: "+15550101851" };
const E2E_VOICEMAIL_PHONE = {
  display: "(555) 010-CI85B",
  normalized: "+15550101852",
};

type AdminClient = ReturnType<typeof createClient<Database>>;

async function resolveUserId(admin: AdminClient, email: string): Promise<string> {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) {
    throw error;
  }
  const match = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!match?.id) {
    throw new Error(
      `E2E user not found for ${email}. Create the user in Supabase Auth (password enabled) before running E2E.`,
    );
  }
  return match.id;
}

async function insertSubject(
  admin: AdminClient,
  params: {
    claimId: string;
    phoneDisplay: string;
    phoneNormalized: string;
    companyIntelStatus: "running" | "completed";
    companyNameSuggested: string | null;
    companyIntelConfidence: number | null;
    companyIntelReasoning: string | null;
  },
): Promise<string> {
  const { data, error } = await admin
    .from("claim_subjects")
    .insert({
      claim_id: params.claimId,
      phone_number: params.phoneDisplay,
      phone_number_normalized: params.phoneNormalized,
      company_name: null,
      company_identified: false,
      call_category: "robocall",
      is_exempt: false,
      metadata: {
        spam_providers: {
          nomorobo: { reported_name: "UNKNOWN" },
        },
      },
      company_intel_status: params.companyIntelStatus,
      company_name_suggested: params.companyNameSuggested,
      company_intel_confidence: params.companyIntelConfidence,
      company_intel_reasoning: params.companyIntelReasoning,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }
  if (!data?.id) {
    throw new Error("claim_subjects insert returned no id");
  }

  const { error: dncError } = await admin.from("dnc_check_results").insert({
    claim_id: params.claimId,
    claim_subject_id: data.id,
    phone_number_normalized: params.phoneNormalized,
    federal_dnc_registered: true,
    federal_dnc_registration_date: "2020-01-01",
    state_dnc_applicable: false,
    state_dnc_state: null,
  });

  if (dncError) {
    throw dncError;
  }

  return data.id;
}

/**
 * Creates a fresh `checking` claim with two subjects for Screen 4 intel UX paths.
 */
export async function seedQualifyScreen4Fixture(): Promise<QualifyScreen4E2EFixture> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const adminKey = getSupabaseAdminKey();
  if (!url || !adminKey) {
    throw new Error("Supabase URL and admin key are required for E2E seeding");
  }

  const admin = createClient<Database>(url, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const email = getE2EUserEmail();
  const userId = await resolveUserId(admin, email);

  const { data: claim, error: claimError } = await admin
    .from("claims")
    .insert({
      user_id: userId,
      violation_type: VIOLATION_TYPE_ID,
      status: "checking",
    })
    .select("id")
    .single();

  if (claimError) {
    throw claimError;
  }
  if (!claim?.id) {
    throw new Error("claims insert returned no id");
  }

  const claimId = claim.id;

  const { error: resumeError } = await admin.from("claim_events").insert({
    claim_id: claimId,
    event_type: "qualification_answer",
    key: QUALIFY_STEP_RESUME_EVENT_KEY,
    value: "3",
    source: "user_input",
  });

  if (resumeError) {
    throw resumeError;
  }

  const [pollingSubjectId, voicemailCtaSubjectId] = await Promise.all([
    insertSubject(admin, {
      claimId,
      phoneDisplay: E2E_POLL_PHONE.display,
      phoneNormalized: E2E_POLL_PHONE.normalized,
      companyIntelStatus: "running",
      companyNameSuggested: null,
      companyIntelConfidence: null,
      companyIntelReasoning: null,
    }),
    insertSubject(admin, {
      claimId,
      phoneDisplay: E2E_VOICEMAIL_PHONE.display,
      phoneNormalized: E2E_VOICEMAIL_PHONE.normalized,
      companyIntelStatus: "completed",
      companyNameSuggested: null,
      companyIntelConfidence: null,
      companyIntelReasoning:
        "Could not identify a company from public sources; voicemail upload recommended.",
    }),
  ]);

  return {
    userId,
    claimId,
    pollingSubjectId,
    voicemailCtaSubjectId,
  };
}
