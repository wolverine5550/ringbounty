import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";
import type { Database } from "@/types/database";

import * as agentModule from "./run-company-intelligence-agent";
import {
  processCompanyIntelligenceRun,
  processCompanyIntelligenceRuns,
} from "./process-company-intelligence-run";

const agentOn = { COMPANY_INTELLIGENCE_AGENT_ENABLED: "true" };

type IntelligenceRunRow =
  Database["public"]["Tables"]["company_intelligence_runs"]["Row"];

const baseRun: IntelligenceRunRow = {
  id: "run-1",
  claim_subject_id: "subject-1",
  phone_number_normalized: "+18005551234",
  status: "running",
  attempt_count: 0,
  next_attempt_at: null,
  started_at: "2026-05-19T00:00:00.000Z",
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
  created_at: "2026-05-19T00:00:00.000Z",
};

describe("processCompanyIntelligenceRun (CI-1.2)", () => {
  it("marks run and subject completed on agent success", async () => {
    vi.spyOn(agentModule, "runCompanyIntelligenceAgent").mockResolvedValue({
      durationMs: 42,
      synthesis: null,
      allSources: [],
      rounds: [],
      roundAudits: [],
      rawResults: {},
      skipPaidRounds: false,
      stoppedEarly: false,
      shortCircuitThreshold: 70,
    });

    const runUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const subjectUpdateEq = vi.fn().mockResolvedValue({ error: null });

    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockImplementation((table: string) => {
      if (table === "company_intelligence_runs") {
        return {
          update: vi.fn().mockReturnValue({ eq: runUpdateEq }),
        } as ReturnType<typeof admin.from>;
      }
      if (table === "claim_subjects") {
        return {
          update: vi.fn().mockReturnValue({ eq: subjectUpdateEq }),
        } as ReturnType<typeof admin.from>;
      }
      return {} as ReturnType<typeof admin.from>;
    });

    const outcome = await processCompanyIntelligenceRun(admin, baseRun, agentOn);
    expect(outcome).toEqual({ runId: "run-1", status: "completed" });
    expect(runUpdateEq).toHaveBeenCalledWith("id", "run-1");
    expect(subjectUpdateEq).toHaveBeenCalledWith("id", "subject-1");
  });

  it("schedules retry on agent failure before max attempts", async () => {
    vi.spyOn(agentModule, "runCompanyIntelligenceAgent").mockRejectedValue(
      new Error("agent_down"),
    );

    const runUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const subjectUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const runUpdate = vi.fn().mockReturnValue({ eq: runUpdateEq });

    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockImplementation((table: string) => {
      if (table === "company_intelligence_runs") {
        return { update: runUpdate } as ReturnType<typeof admin.from>;
      }
      if (table === "claim_subjects") {
        return {
          update: vi.fn().mockReturnValue({ eq: subjectUpdateEq }),
        } as ReturnType<typeof admin.from>;
      }
      return {} as ReturnType<typeof admin.from>;
    });

    const outcome = await processCompanyIntelligenceRun(admin, baseRun, agentOn);
    expect(outcome.status).toBe("retry_pending");
    expect(runUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "pending",
        attempt_count: 1,
        last_error: "agent_down",
      }),
    );
    expect(subjectUpdateEq).toHaveBeenCalledWith("id", "subject-1");
  });

  it("marks terminal failed at max attempts", async () => {
    vi.spyOn(agentModule, "runCompanyIntelligenceAgent").mockRejectedValue(
      new Error("agent_down"),
    );

    const runUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const subjectUpdateEq = vi.fn().mockResolvedValue({ error: null });

    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockImplementation((table: string) => {
      if (table === "company_intelligence_runs") {
        return {
          update: vi.fn().mockReturnValue({ eq: runUpdateEq }),
        } as ReturnType<typeof admin.from>;
      }
      if (table === "claim_subjects") {
        return {
          update: vi.fn().mockReturnValue({ eq: subjectUpdateEq }),
        } as ReturnType<typeof admin.from>;
      }
      return {} as ReturnType<typeof admin.from>;
    });

    const outcome = await processCompanyIntelligenceRun(
      admin,
      { ...baseRun, attempt_count: 2 },
      agentOn,
    );
    expect(outcome).toEqual({ runId: "run-1", status: "failed" });
    expect(subjectUpdateEq).toHaveBeenCalledWith("id", "subject-1");
  });
});

function adminWithRpc(): SupabaseClient<Database> {
  const admin = createMockSupabaseClient();
  const rpc = vi.fn();
  return Object.assign(admin, { rpc }) as SupabaseClient<Database>;
}

describe("processCompanyIntelligenceRuns (CI-1.2.2)", () => {
  it("no-ops when agent flag is off", async () => {
    const admin = adminWithRpc();
    const result = await processCompanyIntelligenceRuns(admin, {
      batchSize: 5,
    });
    expect(result).toEqual({ agentDisabled: true, outcomes: [] });
    expect(admin.rpc).not.toHaveBeenCalled();
  });

  it("claims batch via RPC when runId omitted", async () => {
    vi.spyOn(agentModule, "runCompanyIntelligenceAgent").mockResolvedValue({
      durationMs: 1,
      synthesis: null,
      allSources: [],
      rounds: [],
      roundAudits: [],
      rawResults: {},
      skipPaidRounds: false,
      stoppedEarly: false,
      shortCircuitThreshold: 70,
    });

    const runUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const subjectUpdateEq = vi.fn().mockResolvedValue({ error: null });

    const admin = adminWithRpc();
    vi.mocked(admin.rpc).mockResolvedValue({
      data: [baseRun],
      error: null,
      count: 1,
      status: 200,
      statusText: "OK",
    } as Awaited<ReturnType<typeof admin.rpc>>);
    vi.mocked(admin.from).mockImplementation((table: string) => {
      if (table === "company_intelligence_runs") {
        return {
          update: vi.fn().mockReturnValue({ eq: runUpdateEq }),
        } as ReturnType<typeof admin.from>;
      }
      if (table === "claim_subjects") {
        return {
          update: vi.fn().mockReturnValue({ eq: subjectUpdateEq }),
        } as ReturnType<typeof admin.from>;
      }
      return {} as ReturnType<typeof admin.from>;
    });

    const result = await processCompanyIntelligenceRuns(admin, {
      batchSize: 3,
      env: agentOn,
    });

    expect(admin.rpc).toHaveBeenCalledWith("claim_company_intelligence_runs", {
      p_batch_size: 3,
    });
    expect(result.outcomes).toHaveLength(1);
    expect(result.outcomes[0]?.status).toBe("completed");
  });
});
