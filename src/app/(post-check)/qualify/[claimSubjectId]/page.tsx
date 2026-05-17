import { notFound } from "next/navigation";

import { FederalDncAttestationForm } from "@/components/qualify/federal-dnc-attestation-form";
import { StateDncComingSoon } from "@/components/qualify/state-dnc-coming-soon";
import { enforcePostCheckAccess } from "@/lib/claims/enforce-post-check-access";
import { getFederalDncScreenshotPathFromMetadata } from "@/lib/dnc/federal-dnc-evidence";
import {
  deriveStateDncScaffoldFields,
  getApplicableStateDncCode,
} from "@/lib/dnc/scaffold-state-dnc-row";
import { createClient } from "@/lib/supabase/server";

type QualifyPageProps = {
  params: Promise<{ claimSubjectId: string }>;
  searchParams: Promise<{ claim?: string }>;
};

/**
 * Qualify entry — Phase 6.2 federal DNC attestation gate; full wizard in Phase 7.
 */
export default async function QualifyPage({
  params,
  searchParams,
}: QualifyPageProps) {
  const { claimSubjectId } = await params;
  const { claim } = await searchParams;
  const returnPath = `/qualify/${claimSubjectId}`;

  await enforcePostCheckAccess({
    returnPath,
    claimIdFromQuery: claim ?? null,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: subjectRow, error: loadError } = await supabase
    .from("claim_subjects")
    .select("id, phone_number, metadata")
    .eq("id", claimSubjectId)
    .maybeSingle();

  if (loadError) {
    throw loadError;
  }

  if (!subjectRow?.id) {
    notFound();
  }

  const { data: dncRow } = await supabase
    .from("dnc_check_results")
    .select(
      "federal_dnc_registered, federal_dnc_registration_date, state_dnc_applicable, state_dnc_state",
    )
    .eq("claim_subject_id", claimSubjectId)
    .maybeSingle();

  let applicableStateCode = getApplicableStateDncCode({
    state_dnc_applicable: dncRow?.state_dnc_applicable ?? null,
    state_dnc_registered: null,
    state_dnc_state: dncRow?.state_dnc_state ?? null,
    state_dnc_checked_at: null,
  });

  if (!applicableStateCode && user?.id) {
    const { data: profile } = await supabase
      .from("users")
      .select("state")
      .eq("id", user.id)
      .maybeSingle();
    applicableStateCode = getApplicableStateDncCode(
      deriveStateDncScaffoldFields(profile?.state),
    );
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-6 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          National Do Not Call Registry
        </h1>
        <p className="text-muted-foreground text-sm">
          Step 1 of qualification — confirm your registry status before other
          questions (Phase 7).
        </p>
      </div>
      {applicableStateCode ? (
        <StateDncComingSoon stateCode={applicableStateCode} />
      ) : null}
      <FederalDncAttestationForm
        claimSubjectId={claimSubjectId}
        phoneDisplay={subjectRow.phone_number}
        initialRegistered={dncRow?.federal_dnc_registered ?? null}
        initialRegistrationDate={
          dncRow?.federal_dnc_registration_date ?? null
        }
        initialScreenshotPath={getFederalDncScreenshotPathFromMetadata(
          subjectRow.metadata,
        )}
      />
    </div>
  );
}
