/**
 * Phase 5.4 — Run enabled spam providers for one E.164 number (`Promise.allSettled`).
 */

import { createNomoroboSpamCheckProviderFromEnv } from "./nomorobo-spam-provider";
import { getSpamProviderFeatureFlags } from "./provider-flags";
import { createTwilioSpamCheckProviderFromEnv } from "./twilio-lookup-spam-provider";
import type { SpamCheckProvider, SpamCheckResult } from "./types";

/** Stable provider order for merge precedence (Nomorobo primary). */
export const SPAM_CHECK_PROVIDER_IDS = ["nomorobo", "twilio"] as const;

export type SpamCheckProviderId = (typeof SPAM_CHECK_PROVIDER_IDS)[number];

export type ProviderRunOutcome =
  | { status: "ok"; result: SpamCheckResult }
  | {
      status: "error";
      providerId: SpamCheckProviderId;
      errorCode: string;
    };

export type RunSpamChecksOptions = {
  /** Defaults to env-backed Nomorobo + Twilio factories (no HTTP when flags/keys off). */
  providers?: SpamCheckProvider[];
  env?: Record<string, string | undefined>;
};

/**
 * Builds default Nomorobo + Twilio adapters from env flags and credentials.
 * When disabled or keys are missing, adapters return skipped results (no HTTP).
 */
export function createDefaultSpamCheckProviders(
  env: Record<string, string | undefined> = process.env,
): SpamCheckProvider[] {
  const flags = getSpamProviderFeatureFlags(env);
  return [
    createNomoroboSpamCheckProviderFromEnv(env, flags.nomoroboEnabled),
    createTwilioSpamCheckProviderFromEnv(env, flags.twilioEnabled),
  ];
}

function errorCodeFromReason(reason: unknown): string {
  if (reason instanceof Error && reason.name === "AbortError") {
    return "PROVIDER_TIMEOUT";
  }
  return "PROVIDER_UNHANDLED_EXCEPTION";
}

/**
 * Runs each provider in parallel; one failure does not cancel the others.
 */
export async function runSpamChecks(
  normalizedPhone: string,
  options: RunSpamChecksOptions = {},
): Promise<ProviderRunOutcome[]> {
  const providers =
    options.providers ?? createDefaultSpamCheckProviders(options.env);

  const settled = await Promise.allSettled(
    providers.map((provider) => provider.check(normalizedPhone)),
  );

  return SPAM_CHECK_PROVIDER_IDS.map((providerId, i) => {
    const entry = settled[i];
    if (!entry) {
      return {
        status: "error" as const,
        providerId,
        errorCode: "PROVIDER_SETTLED_MISSING",
      };
    }
    if (entry.status === "fulfilled") {
      return { status: "ok" as const, result: entry.value };
    }
    return {
      status: "error" as const,
      providerId,
      errorCode: errorCodeFromReason(entry.reason),
    };
  });
}

/** Successful {@link SpamCheckResult} rows only (excludes provider errors). */
export function collectOkSpamResults(
  outcomes: ProviderRunOutcome[],
): SpamCheckResult[] {
  return outcomes
    .filter((o): o is Extract<ProviderRunOutcome, { status: "ok" }> => o.status === "ok")
    .map((o) => o.result);
}
