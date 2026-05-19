import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";
import type { Database } from "@/types/database";

import { enqueueCallbackIntelligenceRuns } from "./enqueue-callback-intelligence-runs";
import * as triggerModule from "./trigger-company-intelligence-run";

type IntelligenceRunRow =
  Database["public"]["Tables"]["company_intelligence_runs"]["Row"];

const agentOn = { COMPANY_INTELLIGENCE_AGENT_ENABLED: "true" };

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
  callback_numbers: ["+18005559999", "+18005558888"],
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

describe("enqueueCallbackIntelligenceRuns (CI-6.1)", () => {
  it("enqueues up to two child runs and records parent metadata", async () => {
    vi.spyOn(triggerModule, "triggerCompanyIntelligenceRunFetch").mockImplementation(
      () => {},
    );

    const insert = vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        single: vi
          .fn()
          .mockResolvedValueOnce({ data: { id: "child-1" }, error: null })
          .mockResolvedValueOnce({ data: { id: "child-2" }, error: null }),
      }),
    }));

    const selectLimit = vi
      .fn()
      .mockResolvedValue({ data: [], error: null });
    const selectIn = vi.fn().mockReturnValue({ limit: selectLimit });
    const selectSecondEq = vi.fn().mockReturnValue({ in: selectIn });
    const selectFirstEq = vi.fn().mockReturnValue({ eq: selectSecondEq });
    const select = vi.fn().mockReturnValue({ eq: selectFirstEq });

    const parentUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const parentUpdate = vi.fn().mockReturnValue({ eq: parentUpdateEq });

    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockImplementation((table: string) => {
      if (table === "company_intelligence_runs") {
        return {
          insert,
          select,
          update: parentUpdate,
        } as ReturnType<typeof admin.from>;
      }
      return {} as ReturnType<typeof admin.from>;
    });

    const result = await enqueueCallbackIntelligenceRuns({
      admin,
      parentRun,
      agentResult: {
        synthesis: {
          companyName: null,
          confidence: 0,
          reasoning: "test",
          callbackNumbers: ["+18005559999", "+18005558888"],
          isSpoofedPool: false,
        },
      } as Parameters<typeof enqueueCallbackIntelligenceRuns>[0]["agentResult"],
      env: agentOn,
    });

    expect(result.enqueued).toEqual(["+18005559999", "+18005558888"]);
    expect(insert).toHaveBeenCalledTimes(2);
    expect(parentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        run_metadata: expect.objectContaining({
          callback_children_enqueued: ["+18005559999", "+18005558888"],
        }),
      }),
    );
  });

  it("does not enqueue when parent is already a callback child", async () => {
    const admin = createMockSupabaseClient();
    const result = await enqueueCallbackIntelligenceRuns({
      admin,
      parentRun: { ...parentRun, parent_run_id: "grandparent" },
      agentResult: {
        synthesis: {
          companyName: null,
          confidence: 0,
          reasoning: "test",
          callbackNumbers: ["+18005559999"],
          isSpoofedPool: false,
        },
      } as Parameters<typeof enqueueCallbackIntelligenceRuns>[0]["agentResult"],
      env: agentOn,
    });
    expect(result).toEqual({ enqueued: [], skipped: [] });
    expect(admin.from).not.toHaveBeenCalled();
  });
});
