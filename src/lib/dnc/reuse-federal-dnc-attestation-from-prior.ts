/**
 * Copy a prior federal DNC attestation onto a new claim subject (same account).
 */

import {
  buildFederalDncConfirmationStoragePath,
  FEDERAL_DNC_EVIDENCE_BUCKET,
} from "@/lib/dnc/federal-dnc-evidence";
import { persistFederalDncAttestation } from "@/lib/dnc/persist-federal-dnc-attestation";
import { runStateDncLookupIfEnabled } from "@/lib/dnc/run-state-dnc-lookup";
import type { PriorFederalDncAttestation } from "@/lib/dnc/load-prior-federal-dnc-attestation";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

function extensionFromStoragePath(path: string): string {
  const match = /\.(jpe?g|png|webp|gif|pdf)$/i.exec(path);
  if (!match) {
    return ".pdf";
  }
  const ext = match[0].toLowerCase();
  return ext === ".jpeg" ? ".jpg" : ext;
}

async function copyFederalDncScreenshot(
  admin: SupabaseClient<Database>,
  params: {
    priorPath: string;
    userId: string;
    claimId: string;
    claimSubjectId: string;
  },
): Promise<string | null> {
  const destPath = buildFederalDncConfirmationStoragePath(
    params.userId,
    params.claimId,
    params.claimSubjectId,
    extensionFromStoragePath(params.priorPath),
  );

  const { error } = await admin.storage
    .from(FEDERAL_DNC_EVIDENCE_BUCKET)
    .copy(params.priorPath, destPath);

  if (error) {
    console.error(
      JSON.stringify({
        event: "federal_dnc_screenshot_copy_failed",
        from: params.priorPath,
        to: destPath,
      }),
      error,
    );
    return null;
  }

  return destPath;
}

export type ReuseFederalDncAttestationParams = {
  userClient: SupabaseClient<Database>;
  adminClient: SupabaseClient<Database>;
  userId: string;
  claimId: string;
  claimSubjectId: string;
  phoneNumberNormalized: string;
  userState: string | null;
  prior: PriorFederalDncAttestation;
};

/**
 * Persists prior attestation on the target subject; copies optional screenshot via admin.
 */
export async function reuseFederalDncAttestationFromPrior(
  params: ReuseFederalDncAttestationParams,
) {
  let confirmationScreenshotPath: string | null = null;

  if (params.prior.confirmationScreenshotPath) {
    confirmationScreenshotPath = await copyFederalDncScreenshot(
      params.adminClient,
      {
        priorPath: params.prior.confirmationScreenshotPath,
        userId: params.userId,
        claimId: params.claimId,
        claimSubjectId: params.claimSubjectId,
      },
    );
  }

  const result = await persistFederalDncAttestation(params.userClient, {
    claimId: params.claimId,
    claimSubjectId: params.claimSubjectId,
    phoneNumberNormalized: params.phoneNumberNormalized,
    attestation: params.prior.attestation,
    confirmationScreenshotPath,
    userState: params.userState,
  });

  await runStateDncLookupIfEnabled(params.userClient, {
    claimId: params.claimId,
    claimSubjectId: params.claimSubjectId,
    phoneNumberNormalized: params.phoneNumberNormalized,
    userState: params.userState,
  });

  return result;
}
