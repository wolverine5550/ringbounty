import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";
import type { Database } from "@/types/database";

import { applyCallbackResolutionToParent } from "./apply-callback-resolution-to-parent";
import * as persistModule from "./persist-company-intelligence-outcome";
import type { RunCompanyIntelligenceAgentResult } from "./run-company-intelligence-agent";
import * as seedModule from "./sources/seed-violations";

type IntelligenceRunRow =
  Database["public"]["Tables"]["company_intelligence_runs"]["Row"];

describe("applyCallbackResolutionToParent (CI-6.1.3)", () => {
  it("sets parent suggest fields at callback_confirmed confidence", async () => {
    vi.spyOn(persistModule, "loadSubjectForIntelPersist").mockResolvedValue({
      claimId: "claim-1",
      companyIdentified: false,
      companyName: null,
      isExempt: false,
      anonymousSessionId: null,
      userStateCode: null,
    });
    vi.spyOn(seedModule, "writeBackSeedViolationFromAgent").mockResolvedValue(
      undefined,
    );

    const parentRun: IntelligenceRunRow = {
      id: "parent-run",
      claim_subject_id: "subject-1",
      phone_number_normalized: "+18005551234",
      status: "completed",
      attempt_count: 0,
      next_attempt_at: null,
      started_at: null,
      last_error: null,
      updated_at: "2026-05-19T00:00:00.000Z",
      sources_queried: null,
      raw_results: null,
      synthesized_company_name: null,
      synthesized_confidence: null,
      synthesized_reasoning: null,
      callback_numbers: null,
      is_spoofed_pool: null,
      duration_ms: null,
      openrouter_prompt: null,
      openrouter_response: null,
      estimated_cost_cents: null,
      apis_called: null,
      parent_run_id: null,
      run_metadata: null,
      created_at: "2026-05-19T00:00:00.000Z",
    };

    const childRun: IntelligenceRunRow = {
      ...parentRun,
      id: "child-run",
      parent_run_id: "parent-run",
      phone_number_normalized: "+18005559999",
    };

    const parentSelectEq = vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: parentRun, error: null }),
    });
    const parentSelect = vi.fn().mockReturnValue({ eq: parentSelectEq });

    const subjectUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const subjectUpdate = vi.fn().mockReturnValue({ eq: subjectUpdateEq });

    const runUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const runUpdate = vi.fn().mockReturnValue({ eq: runUpdateEq });

    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockImplementation((table: string) => {
      if (table === "company_intelligence_runs") {
        return { select: parentSelect, update: runUpdate } as ReturnType<
          typeof admin.from
        >;
      }
      if (table === "claim_subjects") {
        return { update: subjectUpdate } as ReturnType<typeof admin.from>;
      }
      return {} as ReturnType<typeof admin.from>;
    });

    const agentResult: RunCompanyIntelligenceAgentResult = {
      durationMs: 0,
      synthesis: {
        companyName: "Acme Collections LLC",
        confidence: 55,
        reasoning: "Multiple complaints name Acme.",
        callbackNumbers: [],
        isSpoofedPool: false,
      },
      allSources: [],
      rounds: [],
      roundAudits: [],
      rawResults: {},
      openrouterPrompt: null,
      openrouterResponse: null,
      skipPaidRounds: false,
      stoppedEarly: false,
      shortCircuitThreshold: 70,
      costEstimate: { estimatedCostCents: 0, apisCalled: [] },
    };

    const outcome = await applyCallbackResolutionToParent({
      admin,
      childRun,
      agentResult,
    });

    expect(outcome).toEqual({ applied: true });
    expect(subjectUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        company_name_suggested: "Acme Collections LLC",
        company_intel_confidence: 90,
        company_intel_reasoning: expect.stringContaining("callback number"),
      }),
    );
    expect(runUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        run_metadata: expect.objectContaining({
          callback_resolved_from: "+18005559999",
          callback_child_run_id: "child-run",
        }),
      }),
    );
  });
});
