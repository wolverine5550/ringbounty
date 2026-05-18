import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import { runStateDncLookupIfEnabled } from "./run-state-dnc-lookup";

describe("runStateDncLookupIfEnabled (§13.7)", () => {
  it("returns not_applicable for non-registry state", async () => {
    const supabase = createMockSupabaseClient();
    const result = await runStateDncLookupIfEnabled(
      supabase,
      {
        claimId: "c1",
        claimSubjectId: "s1",
        phoneNumberNormalized: "+15551234567",
        userState: "CA",
      },
      {},
    );
    expect(result).toEqual({ ran: false, reason: "not_applicable" });
  });

  it("returns flag_disabled when env is off", async () => {
    const supabase = createMockSupabaseClient();
    const result = await runStateDncLookupIfEnabled(
      supabase,
      {
        claimId: "c1",
        claimSubjectId: "s1",
        phoneNumberNormalized: "+15551234567",
        userState: "CO",
      },
      { STATE_DNC_CO_ENABLED: "false" },
    );
    expect(result).toEqual({ ran: false, reason: "flag_disabled" });
  });

  it("runs lookup when flag is on but does not persist unavailable result", async () => {
    const supabase = createMockSupabaseClient();
    const result = await runStateDncLookupIfEnabled(
      supabase,
      {
        claimId: "c1",
        claimSubjectId: "s1",
        phoneNumberNormalized: "+15551234567",
        userState: "CO",
      },
      { STATE_DNC_CO_ENABLED: "true" },
    );
    expect(result).toEqual({
      ran: true,
      stateCode: "CO",
      persisted: false,
      stateDncRegistered: null,
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
