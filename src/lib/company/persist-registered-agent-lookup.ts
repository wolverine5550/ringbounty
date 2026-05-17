/**
 * Phase 6.5.3 — Persist registered agent fields on `claim_subjects` + `claim_events`.
 */

import { REGISTERED_AGENT_LOOKUP_SOURCE_OPENCORPORATES } from "@/lib/constants/registered-agent-lookup";
import { assertOpenCorporatesLookupAllowed } from "@/lib/rate-limit/assert-opencorporates-lookup-allowed";
import type { Database, Json } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  lookupRegisteredAgentViaOpenCorporates,
  type LookupRegisteredAgentOptions,
} from "./lookup-registered-agent-opencorporates";

const RA_LOOKUP_EVENT = "registered_agent_lookup" as const;

export type PersistRegisteredAgentLookupParams = {
  claimId: string;
  claimSubjectId: string;
  companyName: string;
  userStateCode?: string | null;
  /** For §6.5.5 session budget; omit on authenticated qualify paths. */
  anonymousSessionId?: string | null;
  lookup?: Omit<LookupRegisteredAgentOptions, "companyName" | "userStateCode">;
};

export type PersistRegisteredAgentLookupResult = {
  found: boolean;
  registeredAgentName: string | null;
  registeredAgentAddress: string | null;
  registeredAgentLookupSource: string | null;
  manualLookupRequired: boolean;
  rateLimited: boolean;
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

/**
 * Runs OpenCorporates RA lookup (when company name present), persists subject columns + events.
 */
export async function persistRegisteredAgentLookup(
  admin: SupabaseClient<Database>,
  params: PersistRegisteredAgentLookupParams,
): Promise<PersistRegisteredAgentLookupResult> {
  const companyName = params.companyName.trim();
  if (!companyName) {
    return {
      found: false,
      registeredAgentName: null,
      registeredAgentAddress: null,
      registeredAgentLookupSource: null,
      manualLookupRequired: false,
      rateLimited: false,
    };
  }

  const rateCheck = await assertOpenCorporatesLookupAllowed(
    admin,
    params.anonymousSessionId,
  );
  const rateLimited = !rateCheck.allowed;

  const lookup = await lookupRegisteredAgentViaOpenCorporates({
    companyName,
    userStateCode: params.userStateCode,
    rateLimited,
    ...params.lookup,
  });

  const { data: existing, error: loadError } = await admin
    .from("claim_subjects")
    .select("metadata")
    .eq("id", params.claimSubjectId)
    .maybeSingle();

  if (loadError) {
    throw loadError;
  }

  const priorMeta = isRecord(existing?.metadata) ? existing.metadata : {};
  const metadataPatch: Record<string, Json> = {
    opencorporates_registered_agent_lookup: {
      skipped_reason: lookup.skippedReason,
      matched_jurisdiction: lookup.matchedJurisdiction,
      rate_limited: rateLimited,
    } as Json,
  };

  const subjectPatch: Database["public"]["Tables"]["claim_subjects"]["Update"] = {
    metadata: { ...priorMeta, ...metadataPatch },
  };

  if (lookup.found && lookup.name) {
    subjectPatch.registered_agent_name = lookup.name;
    subjectPatch.registered_agent_address = lookup.address;
    subjectPatch.registered_agent_lookup_source =
      REGISTERED_AGENT_LOOKUP_SOURCE_OPENCORPORATES;
  }

  const { error: updateError } = await admin
    .from("claim_subjects")
    .update(subjectPatch)
    .eq("id", params.claimSubjectId);

  if (updateError) {
    throw updateError;
  }

  const eventRows: Database["public"]["Tables"]["claim_events"]["Insert"][] = [
    {
      claim_id: params.claimId,
      event_type: RA_LOOKUP_EVENT,
      key: "registered_agent_found",
      value: String(lookup.found),
      source: "opencorporates",
    },
    {
      claim_id: params.claimId,
      event_type: RA_LOOKUP_EVENT,
      key: "provider_raw",
      value: safeJsonStringify(lookup.raw),
      source: "opencorporates",
    },
  ];

  if (lookup.skippedReason) {
    eventRows.push({
      claim_id: params.claimId,
      event_type: RA_LOOKUP_EVENT,
      key: "skipped_reason",
      value: lookup.skippedReason,
      source: "opencorporates",
    });
  }

  if (rateLimited) {
    eventRows.push({
      claim_id: params.claimId,
      event_type: RA_LOOKUP_EVENT,
      key: "rate_limited",
      value: "true",
      source: "system",
    });
  }

  if (lookup.found && lookup.name) {
    eventRows.push(
      {
        claim_id: params.claimId,
        event_type: RA_LOOKUP_EVENT,
        key: "registered_agent_name",
        value: lookup.name,
        source: "opencorporates",
      },
      {
        claim_id: params.claimId,
        event_type: RA_LOOKUP_EVENT,
        key: "registered_agent_lookup_source",
        value: REGISTERED_AGENT_LOOKUP_SOURCE_OPENCORPORATES,
        source: "opencorporates",
      },
    );
    if (lookup.address) {
      eventRows.push({
        claim_id: params.claimId,
        event_type: RA_LOOKUP_EVENT,
        key: "registered_agent_address",
        value: lookup.address,
        source: "opencorporates",
      });
    }
  }

  const { error: insertError } = await admin.from("claim_events").insert(eventRows);
  if (insertError) {
    throw insertError;
  }

  return {
    found: lookup.found,
    registeredAgentName: lookup.found ? lookup.name : null,
    registeredAgentAddress: lookup.found ? lookup.address : null,
    registeredAgentLookupSource: lookup.found
      ? REGISTERED_AGENT_LOOKUP_SOURCE_OPENCORPORATES
      : null,
    manualLookupRequired: !lookup.found && !rateLimited,
    rateLimited,
  };
}
