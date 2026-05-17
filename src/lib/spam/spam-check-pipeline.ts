/**
 * Phase 5.4 — Per-number spam pipeline for `/api/check/submit` (replaces §4.6 stubs).
 * Runs Nomorobo + Twilio via {@link runSpamChecks}, persists via {@link persistSpamCheckOutcome},
 * and returns the §4.6 `number_checks` shape for the client.
 */

import type {
  NumberCheckSummary,
  ProviderCheckOutcome,
} from "@/lib/check/parallel-check-pipeline-stub";
import { isDebtCollectionCallCategory } from "@/lib/constants/fdcpa-debt-collection";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isSkippedSpamResult } from "./merge-spam-results";
import { persistSpamCheckOutcome } from "./persist-spam-check-outcome";
import {
  runSpamChecks,
  type ProviderRunOutcome,
  type RunSpamChecksOptions,
} from "./run-spam-checks";
import type { SpamCheckProvider } from "./types";

export type RunSpamChecksForPhoneListParams = {
  claimId: string;
  phones: { phoneNumberNormalized: string; subjectId: string | null }[];
  providers?: SpamCheckProvider[];
  env?: Record<string, string | undefined>;
};

function providerOutcomeToApi(
  outcome: ProviderRunOutcome,
): ProviderCheckOutcome {
  if (outcome.status === "error") {
    return {
      provider_id: outcome.providerId,
      status: "error",
      error_code: outcome.errorCode,
    };
  }
  if (isSkippedSpamResult(outcome.result)) {
    return { provider_id: outcome.result.providerId, status: "ok" };
  }
  return { provider_id: outcome.result.providerId, status: "ok" };
}

function logProviderCheckFailure(
  outcome: Extract<ProviderCheckOutcome, { status: "error" }>,
  phoneNormalized: string,
): void {
  console.error(
    JSON.stringify({
      event: "check_provider_failure",
      provider_id: outcome.provider_id,
      error_code: outcome.error_code,
      phone_last4: phoneNormalized.slice(-4),
    }),
  );
}

function logNumberPipelineFailure(
  phoneNormalized: string,
  errorCode: string,
): void {
  console.error(
    JSON.stringify({
      event: "check_number_pipeline_failure",
      error_code: errorCode,
      phone_last4: phoneNormalized.slice(-4),
    }),
  );
}

/**
 * Runs spam checks for each phone (parallel across numbers), persists when `subjectId` is set.
 */
export async function runSpamChecksForPhoneList(
  admin: SupabaseClient<Database>,
  params: RunSpamChecksForPhoneListParams,
): Promise<NumberCheckSummary[]> {
  const runOptions: RunSpamChecksOptions = {
    providers: params.providers,
    env: params.env,
  };

  const settled = await Promise.allSettled(
    params.phones.map(async (p) => {
      const providerOutcomes = await runSpamChecks(
        p.phoneNumberNormalized,
        runOptions,
      );

      let merged = null;
      if (p.subjectId) {
        merged = await persistSpamCheckOutcome(admin, {
          claimId: params.claimId,
          claimSubjectId: p.subjectId,
          phoneNumberNormalized: p.phoneNumberNormalized,
          providerOutcomes,
        });
      }

      const providers = providerOutcomes.map(providerOutcomeToApi);
      let had_provider_failure = false;
      for (const pr of providers) {
        if (pr.status === "error") {
          had_provider_failure = true;
          logProviderCheckFailure(pr, p.phoneNumberNormalized);
        }
      }

      return {
        phone_number_normalized: p.phoneNumberNormalized,
        claim_subject_id: p.subjectId,
        providers,
        had_provider_failure,
        ...(merged
          ? {
              is_exempt: merged.isExempt,
              call_category: merged.callCategory,
              is_known_spammer: merged.isKnownSpammer,
              is_debt_collection: isDebtCollectionCallCategory(
                merged.callCategory,
              ),
              company_identified: merged.companyIdentified,
              company_name: merged.companyName,
              company_name_hint: merged.companyNameHint,
            }
          : {}),
      } satisfies NumberCheckSummary;
    }),
  );

  return params.phones.map((p, i) => {
    const s = settled[i];
    if (s?.status === "fulfilled") {
      return s.value;
    }
    logNumberPipelineFailure(
      p.phoneNumberNormalized,
      "NUMBER_CHECK_EXCEPTION",
    );
    return {
      phone_number_normalized: p.phoneNumberNormalized,
      claim_subject_id: p.subjectId,
      providers: [
        { provider_id: "nomorobo", status: "error", error_code: "NUMBER_CHECK_EXCEPTION" },
        { provider_id: "twilio", status: "error", error_code: "NUMBER_CHECK_EXCEPTION" },
      ],
      had_provider_failure: true,
    };
  });
}
