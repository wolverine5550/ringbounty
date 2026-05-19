import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";
import type { Database } from "@/types/database";

import {
  COMPANY_IDENTIFICATION_SOURCE_KEY,
  COMPANY_INTEL_APIS_CALLED_KEY,
  COMPANY_INTEL_ESTIMATED_COST_CENTS_KEY,
  COMPANY_INTELLIGENCE_COMPLETED_KEY,
  COMPANY_INTELLIGENCE_EVENT_SOURCE,
  COMPANY_INTELLIGENCE_EVENT_TYPE,
  COMPANY_NAME_SUGGESTED_EVENT_KEY,
} from "./company-intelligence-events";
import { persistCompanyIntelligenceOutcome } from "./persist-company-intelligence-outcome";
import * as callbackModule from "./apply-callback-resolution-to-parent";
import * as raModule from "@/lib/company/persist-registered-agent-lookup";
import * as seedModule from "./sources/seed-violations";
import type { RunCompanyIntelligenceAgentResult } from "./run-company-intelligence-agent";

type IntelligenceRunRow =
  Database["public"]["Tables"]["company_intelligence_runs"]["Row"];

const baseRun = {
  id: "run-1",
  claim_subject_id: "subject-1",
  phone_number_normalized: "+18005551234",
} as Pick<
  IntelligenceRunRow,
  "id" | "claim_subject_id" | "phone_number_normalized"
> as IntelligenceRunRow;

const baseAgentResult: RunCompanyIntelligenceAgentResult = {
  durationMs: 10,
  synthesis: {
    companyName: "CarShield",
    confidence: 85,
    reasoning: "FTC seed Path A",
    callbackNumbers: [],
    isSpoofedPool: false,
  },
  allSources: [{ tier: "ftc_complaint_high", companyName: "CarShield" }],
  rounds: [],
  roundAudits: [],
  rawResults: {},
  openrouterPrompt: null,
  openrouterResponse: null,
  skipPaidRounds: true,
  stoppedEarly: true,
  shortCircuitThreshold: 70,
  costEstimate: { estimatedCostCents: 0, apisCalled: [] },
};

function mockAdminForPersist(input: {
  companyIdentified?: boolean;
  userStateCode?: string | null;
}) {
  const subjectUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const subjectUpdate = vi.fn().mockReturnValue({ eq: subjectUpdateEq });
  const eventsInsert = vi.fn().mockResolvedValue({ error: null });

  const admin = createMockSupabaseClient();
  vi.mocked(admin.from).mockImplementation((table: string) => {
    if (table === "claim_subjects") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                claim_id: "claim-1",
                company_identified: input.companyIdentified ?? false,
                company_name: null,
                is_exempt: false,
                claims: {
                  anonymous_session_id: "sess-1",
                  user_id: "user-1",
                  users: { state: input.userStateCode ?? "CA" },
                },
              },
              error: null,
            }),
          }),
        }),
        update: subjectUpdate,
      } as ReturnType<typeof admin.from>;
    }
    if (table === "claim_events") {
      return { insert: eventsInsert } as ReturnType<typeof admin.from>;
    }
    return {} as ReturnType<typeof admin.from>;
  });

  return { admin, subjectUpdate, subjectUpdateEq, eventsInsert };
}

describe("persistCompanyIntelligenceOutcome (CI-3.2)", () => {
  it("CI-3.2.1 v1 sets suggest fields and does not set company_identified", async () => {
    const writeBack = vi
      .spyOn(seedModule, "writeBackSeedViolationFromAgent")
      .mockResolvedValue();
    const { admin, subjectUpdate, subjectUpdateEq, eventsInsert } =
      mockAdminForPersist({});

    const result = await persistCompanyIntelligenceOutcome({
      admin,
      run: baseRun,
      agentResult: baseAgentResult,
      env: { COMPANY_INTEL_AUTO_PROMOTE_ENABLED: "false" },
    });

    expect(result.autoPromoted).toBe(false);
    expect(subjectUpdateEq).toHaveBeenCalledWith("id", "subject-1");
    expect(subjectUpdate.mock.calls[0]?.[0]).toMatchObject({
      company_intel_status: "completed",
      company_name_suggested: "CarShield",
      company_intel_confidence: 85,
    });
    expect(subjectUpdate.mock.calls[0]?.[0]).not.toHaveProperty(
      "company_identified",
      true,
    );
    expect(writeBack).toHaveBeenCalled();
    expect(eventsInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          event_type: COMPANY_INTELLIGENCE_EVENT_TYPE,
          key: COMPANY_INTELLIGENCE_COMPLETED_KEY,
          value: "true",
          source: COMPANY_INTELLIGENCE_EVENT_SOURCE,
        }),
        expect.objectContaining({
          key: COMPANY_IDENTIFICATION_SOURCE_KEY,
          value: COMPANY_INTELLIGENCE_EVENT_SOURCE,
        }),
        expect.objectContaining({
          key: COMPANY_NAME_SUGGESTED_EVENT_KEY,
          value: "CarShield",
        }),
        expect.objectContaining({
          key: COMPANY_INTEL_ESTIMATED_COST_CENTS_KEY,
          value: "0",
        }),
        expect.objectContaining({
          key: COMPANY_INTEL_APIS_CALLED_KEY,
          value: "[]",
        }),
      ]),
    );
  });

  it("CI-4.3.1 emits cost claim_events when paid APIs were billed", async () => {
    vi.spyOn(seedModule, "writeBackSeedViolationFromAgent").mockResolvedValue();
    const { admin, eventsInsert } = mockAdminForPersist({});

    await persistCompanyIntelligenceOutcome({
      admin,
      run: baseRun,
      agentResult: {
        ...baseAgentResult,
        costEstimate: {
          estimatedCostCents: 11,
          apisCalled: ["serpapi", "openrouter"] as const,
        },
      },
    });

    expect(eventsInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          key: COMPANY_INTEL_ESTIMATED_COST_CENTS_KEY,
          value: "11",
        }),
        expect.objectContaining({
          key: COMPANY_INTEL_APIS_CALLED_KEY,
          value: JSON.stringify(["serpapi", "openrouter"]),
        }),
      ]),
    );
  });

  it("CI-3.2.1 preserves company_identified when Lane A already identified", async () => {
    const { admin, subjectUpdate } = mockAdminForPersist({
      companyIdentified: true,
    });
    vi.spyOn(seedModule, "writeBackSeedViolationFromAgent").mockResolvedValue();

    await persistCompanyIntelligenceOutcome({
      admin,
      run: baseRun,
      agentResult: baseAgentResult,
      env: { COMPANY_INTEL_AUTO_PROMOTE_ENABLED: "true" },
    });

    expect(subjectUpdate.mock.calls[0]?.[0]).not.toHaveProperty(
      "company_identified",
    );
    expect(subjectUpdate.mock.calls[0]?.[0]).not.toHaveProperty("company_name");
  });

  it("CI-3.2.3 v2 auto-promote sets company_name when flag on and tier allowed", async () => {
    vi.spyOn(seedModule, "writeBackSeedViolationFromAgent").mockResolvedValue();
    const raSpy = vi
      .spyOn(raModule, "persistRegisteredAgentLookup")
      .mockResolvedValue({
        found: false,
        registeredAgentName: null,
        registeredAgentAddress: null,
        registeredAgentLookupSource: null,
        manualLookupRequired: true,
        rateLimited: false,
      });

    const { admin, subjectUpdate } = mockAdminForPersist({
      userStateCode: "NY",
    });

    const result = await persistCompanyIntelligenceOutcome({
      admin,
      run: baseRun,
      agentResult: {
        ...baseAgentResult,
        allSources: [
          { tier: "ftc_enforcement", companyName: "CarShield" },
        ],
      },
      env: { COMPANY_INTEL_AUTO_PROMOTE_ENABLED: "true" },
    });

    expect(result.autoPromoted).toBe(true);
    expect(subjectUpdate.mock.calls[0]?.[0]).toMatchObject({
      company_name: "CarShield",
      company_identified: true,
    });
    expect(raSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        companyName: "CarShield",
        userStateCode: "NY",
      }),
    );
  });

  it("CI-3.3.3 v1 never sets company_identified even with v2-eligible enforcement tier", async () => {
    vi.spyOn(seedModule, "writeBackSeedViolationFromAgent").mockResolvedValue();
    const { admin, subjectUpdate } = mockAdminForPersist({});

    const result = await persistCompanyIntelligenceOutcome({
      admin,
      run: baseRun,
      agentResult: {
        ...baseAgentResult,
        allSources: [
          { tier: "ftc_enforcement", companyName: "CarShield" },
        ],
      },
      env: { COMPANY_INTEL_AUTO_PROMOTE_ENABLED: "false" },
    });

    expect(result.autoPromoted).toBe(false);
    expect(subjectUpdate.mock.calls[0]?.[0]).not.toHaveProperty(
      "company_identified",
      true,
    );
    expect(subjectUpdate.mock.calls[0]?.[0]).not.toHaveProperty("company_name");
  });

  it("CI-3.2.3 v2 does not promote SerpAPI-only hits", async () => {
    vi.spyOn(seedModule, "writeBackSeedViolationFromAgent").mockResolvedValue();
    const raSpy = vi.spyOn(raModule, "persistRegisteredAgentLookup");

    const { admin, subjectUpdate } = mockAdminForPersist({});

    const result = await persistCompanyIntelligenceOutcome({
      admin,
      run: baseRun,
      agentResult: {
        ...baseAgentResult,
        allSources: [
          { tier: "serpapi", companyName: "CarShield" },
          { tier: "openrouter_synthesis", companyName: "CarShield" },
        ],
      },
      env: { COMPANY_INTEL_AUTO_PROMOTE_ENABLED: "true" },
    });

    expect(result.autoPromoted).toBe(false);
    expect(subjectUpdate.mock.calls[0]?.[0]).not.toHaveProperty(
      "company_identified",
      true,
    );
    expect(raSpy).not.toHaveBeenCalled();
  });

  it("CI-6.1 callback child skips subject patch and resolves parent", async () => {
    vi.spyOn(seedModule, "writeBackSeedViolationFromAgent").mockResolvedValue();
    const callbackSpy = vi
      .spyOn(callbackModule, "applyCallbackResolutionToParent")
      .mockResolvedValue({ applied: true });

    const { admin, subjectUpdate } = mockAdminForPersist({});

    const result = await persistCompanyIntelligenceOutcome({
      admin,
      run: { ...baseRun, parent_run_id: "parent-run" } as IntelligenceRunRow,
      agentResult: baseAgentResult,
    });

    expect(result.autoPromoted).toBe(false);
    expect(subjectUpdate).not.toHaveBeenCalled();
    expect(callbackSpy).toHaveBeenCalled();
  });
});
