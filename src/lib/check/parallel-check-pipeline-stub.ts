/**
 * §4.6 — Parallel per-number checks with `Promise.allSettled` (stub providers for tests).
 * Production submit uses {@link runSpamChecksForPhoneList} in `src/lib/spam/spam-check-pipeline.ts` (§5.4).
 * Response shape (`NumberCheckSummary`) is shared with the real pipeline.
 */

export const CHECK_PIPELINE_STUB_PROVIDER_IDS = [
  "nomorobo_stub",
  "twilio_stub",
] as const;

export type CheckPipelineStubProviderId =
  (typeof CHECK_PIPELINE_STUB_PROVIDER_IDS)[number];

export type ProviderCheckOutcome =
  | { provider_id: string; status: "ok" }
  | { provider_id: string; status: "error"; error_code: string };

export type NumberCheckSummary = {
  phone_number_normalized: string;
  claim_subject_id: string | null;
  providers: ProviderCheckOutcome[];
  /** True if any provider returned `error` or threw (outer `allSettled` rejection). */
  had_provider_failure: boolean;
  /** PRD §6 — set when merged `call_category` is TCPA-exempt (§5.5). */
  is_exempt?: boolean;
  call_category?: string | null;
  /** PRD §7 — OR of provider spam flags after merge (§5.4). */
  is_known_spammer?: boolean;
  /** Phase 5.7 — merged category is debt collection (FDCPA note; TCPA letter blocked). */
  is_debt_collection?: boolean;
  /** Phase 6.4 — spam merge resolved a company name for this caller number. */
  company_identified?: boolean;
  company_name?: string | null;
  /** Twilio CNAM / Whitepages — not letter-grade identification (§6.4). */
  company_name_hint?: string | null;
  /** Phase 6.5 — OpenCorporates registered agent when lookup ran. */
  registered_agent_found?: boolean;
  registered_agent_name?: string | null;
  registered_agent_manual_lookup_required?: boolean;
  registered_agent_rate_limited?: boolean;
  /** USPS code for SOS manual-lookup link (§6.5.4). */
  user_state_code?: string | null;
};

export type RunStubPipelineOptions = {
  /** When set, that provider returns a structured error for every number (tests + demos). */
  failProviderId?: string | null;
};

async function stubProviderCall(
  providerId: CheckPipelineStubProviderId,
  phoneNormalized: string,
  options: RunStubPipelineOptions,
): Promise<ProviderCheckOutcome> {
  if (options.failProviderId === providerId) {
    return {
      provider_id: providerId,
      status: "error",
      error_code: "STUB_PROVIDER_UNAVAILABLE",
    };
  }
  void phoneNormalized;
  return { provider_id: providerId, status: "ok" };
}

/**
 * Runs all stub providers for one number in parallel; one failure does not cancel the others.
 */
export async function runStubProvidersForPhone(
  phoneNormalized: string,
  options: RunStubPipelineOptions = {},
): Promise<ProviderCheckOutcome[]> {
  const ids = [...CHECK_PIPELINE_STUB_PROVIDER_IDS];
  const settled = await Promise.allSettled(
    ids.map((id) => stubProviderCall(id, phoneNormalized, options)),
  );
  return ids.map((id, i) => {
    const s = settled[i];
    if (!s) {
      return {
        provider_id: id,
        status: "error" as const,
        error_code: "PROVIDER_SETTLED_MISSING",
      };
    }
    if (s.status === "fulfilled") {
      return s.value;
    }
    return {
      provider_id: id,
      status: "error" as const,
      error_code: "PROVIDER_UNHANDLED_EXCEPTION",
    };
  });
}

export function logProviderCheckFailure(
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
 * Runs stub checks for many numbers in parallel; each number also runs its own provider pool.
 */
export async function runStubChecksForPhoneList(
  phones: { phoneNumberNormalized: string; subjectId: string | null }[],
  options: RunStubPipelineOptions = {},
): Promise<NumberCheckSummary[]> {
  const settled = await Promise.allSettled(
    phones.map(async (p) => {
      const providers = await runStubProvidersForPhone(
        p.phoneNumberNormalized,
        options,
      );
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
      } satisfies NumberCheckSummary;
    }),
  );

  return phones.map((p, i) => {
    const s = settled[i];
    if (s?.status === "fulfilled") {
      return s.value;
    }
    logNumberPipelineFailure(p.phoneNumberNormalized, "NUMBER_CHECK_EXCEPTION");
    return {
      phone_number_normalized: p.phoneNumberNormalized,
      claim_subject_id: p.subjectId,
      providers: [...CHECK_PIPELINE_STUB_PROVIDER_IDS].map((id) => ({
        provider_id: id,
        status: "error" as const,
        error_code: "NUMBER_CHECK_EXCEPTION",
      })),
      had_provider_failure: true,
    };
  });
}
