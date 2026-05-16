import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import {
  persistFederalDncAttestation,
  resolveFederalDncEligibleFromAttestation,
} from "./persist-federal-dnc-attestation";

describe("resolveFederalDncEligibleFromAttestation (§6.2.2)", () => {
  it("returns false when not registered", () => {
    expect(
      resolveFederalDncEligibleFromAttestation(
        { federalDncRegistered: false, federalDncRegistrationDate: null },
        "2008-01-01",
      ),
    ).toBe(false);
  });

  it("returns null when registered but call date unknown", () => {
    expect(
      resolveFederalDncEligibleFromAttestation(
        {
          federalDncRegistered: true,
          federalDncRegistrationDate: "2007-10-17",
        },
        null,
      ),
    ).toBeNull();
  });

  it("computes eligible when dates satisfy 31-day rule", () => {
    expect(
      resolveFederalDncEligibleFromAttestation(
        {
          federalDncRegistered: true,
          federalDncRegistrationDate: "2007-10-17",
        },
        "2008-01-01",
      ),
    ).toBe(true);
  });
});

describe("persistFederalDncAttestation (§6.2.1)", () => {
  it("inserts dnc row and claim_events on first attestation", async () => {
    const client = createMockSupabaseClient();
    const dncChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
    };
    const eventsChain = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    vi.mocked(client.from).mockImplementation((table) => {
      if (table === "dnc_check_results") {
        return dncChain as never;
      }
      if (table === "claim_events") {
        return eventsChain as never;
      }
      return createMockSupabaseClient().from(table);
    });

    const result = await persistFederalDncAttestation(client, {
      claimId: "claim-1",
      claimSubjectId: "subject-1",
      phoneNumberNormalized: "+15551234567",
      attestation: {
        federalDncRegistered: true,
        federalDncRegistrationDate: "2007-10-17",
      },
      earliestCallDate: "2008-01-01",
    });

    expect(result.federalDncEligible).toBe(true);
    expect(result.matrixPoints).toBe(25);
    expect(dncChain.insert).toHaveBeenCalled();
    expect(eventsChain.insert).toHaveBeenCalled();
  });
});
