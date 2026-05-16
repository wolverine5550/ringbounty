/**
 * Phase 5.4.3 — Persist merged spam check to `claim_subjects` + `claim_events`.
 */

import type { ClaimEventSource } from "@/lib/constants/claimEvent";
import type { Database, Json } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  mergeSpamCheckResults,
  type MergedSpamCheckOutcome,
} from "./merge-spam-results";
import {
  collectOkSpamResults,
  type ProviderRunOutcome,
} from "./run-spam-checks";
import type { SpamCheckResult } from "./types";

const SPAM_DB_MATCH_EVENT = "spam_db_match" as const;

export type PersistSpamCheckOutcomeParams = {
  claimId: string;
  claimSubjectId: string;
  providerOutcomes: ProviderRunOutcome[];
  /** When omitted, merged from successful provider rows. */
  merged?: MergedSpamCheckOutcome;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ error: "non_serializable_raw" });
  }
}

function mergedEventSource(merged: MergedSpamCheckOutcome): ClaimEventSource {
  switch (merged.spamDbSource) {
    case "nomorobo":
      return "nomorobo";
    case "twilio":
      return "twilio";
    case "both":
      return "nomorobo";
    case "none":
      return "system";
    default:
      return "system";
  }
}

function buildProviderMetadata(
  results: SpamCheckResult[],
): Record<string, Json> {
  const providers: Record<string, Json> = {};
  for (const r of results) {
    providers[r.providerId] = r.raw as Json;
  }
  return { spam_providers: providers };
}

/** PRD example keys for `event_type = spam_db_match` (merged summary). */
function buildMergedClaimEventRows(
  claimId: string,
  merged: MergedSpamCheckOutcome,
): Database["public"]["Tables"]["claim_events"]["Insert"][] {
  const source = mergedEventSource(merged);
  const rows: Database["public"]["Tables"]["claim_events"]["Insert"][] = [
    {
      claim_id: claimId,
      event_type: SPAM_DB_MATCH_EVENT,
      key: "is_known_spammer",
      value: String(merged.isKnownSpammer),
      source,
    },
  ];

  if (merged.confidenceScore !== null) {
    rows.push({
      claim_id: claimId,
      event_type: SPAM_DB_MATCH_EVENT,
      key: "confidence_score",
      value: String(merged.confidenceScore),
      source,
    });
  }
  if (merged.complaintCount !== null) {
    rows.push({
      claim_id: claimId,
      event_type: SPAM_DB_MATCH_EVENT,
      key: "complaint_count",
      value: String(merged.complaintCount),
      source,
    });
  }
  if (merged.callCategory !== null) {
    rows.push({
      claim_id: claimId,
      event_type: SPAM_DB_MATCH_EVENT,
      key: "call_category",
      value: merged.callCategory,
      source,
    });
  }
  if (merged.companyName !== null) {
    rows.push({
      claim_id: claimId,
      event_type: SPAM_DB_MATCH_EVENT,
      key: "company_name",
      value: merged.companyName,
      source,
    });
  }

  return rows;
}

function buildPerProviderClaimEventRows(
  claimId: string,
  results: SpamCheckResult[],
): Database["public"]["Tables"]["claim_events"]["Insert"][] {
  return results.map((r) => ({
    claim_id: claimId,
    event_type: SPAM_DB_MATCH_EVENT,
    key: "provider_raw",
    value: safeJsonStringify(r.raw),
    source: r.providerId as ClaimEventSource,
  }));
}

/**
 * Updates one `claim_subjects` row and appends `claim_events` for provider raw + merged keys.
 */
export async function persistSpamCheckOutcome(
  admin: SupabaseClient<Database>,
  params: PersistSpamCheckOutcomeParams,
): Promise<MergedSpamCheckOutcome> {
  const okResults = collectOkSpamResults(params.providerOutcomes);
  const merged =
    params.merged ?? mergeSpamCheckResults(okResults);

  const { data: existing, error: loadError } = await admin
    .from("claim_subjects")
    .select("metadata")
    .eq("id", params.claimSubjectId)
    .maybeSingle();

  if (loadError) {
    throw loadError;
  }

  const priorMeta = isRecord(existing?.metadata) ? existing.metadata : {};
  const metadata: Json = {
    ...priorMeta,
    ...buildProviderMetadata(okResults),
  };

  const subjectPatch: Database["public"]["Tables"]["claim_subjects"]["Update"] = {
    spam_db_source: merged.spamDbSource,
    spam_db_confidence_score: merged.confidenceScore,
    spam_db_complaint_count:
      merged.complaintCount !== null && merged.complaintCount > 0
        ? merged.complaintCount
        : merged.complaintCount === 0
          ? 0
          : null,
    call_category: merged.callCategory,
    company_name: merged.companyName,
    company_identified: merged.companyIdentified,
    is_exempt: merged.isExempt,
    exempt_reason: merged.exemptReason,
    metadata,
  };

  const { error: updateError } = await admin
    .from("claim_subjects")
    .update(subjectPatch)
    .eq("id", params.claimSubjectId);

  if (updateError) {
    throw updateError;
  }

  const eventRows = [
    ...buildPerProviderClaimEventRows(params.claimId, okResults),
    ...buildMergedClaimEventRows(params.claimId, merged),
  ];

  if (eventRows.length > 0) {
    const { error: insertError } = await admin
      .from("claim_events")
      .insert(eventRows);
    if (insertError) {
      throw insertError;
    }
  }

  return merged;
}
