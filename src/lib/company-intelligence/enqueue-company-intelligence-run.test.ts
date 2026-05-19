import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import {
  enqueueCompanyIntelligenceRun,
  maybeEnqueueCompanyIntelligenceRun,
} from "./enqueue-company-intelligence-run";
import * as triggerModule from "./trigger-company-intelligence-run";

const agentOn = { COMPANY_INTELLIGENCE_AGENT_ENABLED: "true" };

describe("enqueueCompanyIntelligenceRun (CI-1.1)", () => {
  it("skips insert when flag off", async () => {
    const admin = createMockSupabaseClient();
    const result = await enqueueCompanyIntelligenceRun(admin, {
      claimSubjectId: "subject-1",
      phoneNumberNormalized: "+18005551234",
      companyIdentified: false,
      isExempt: false,
    });
    expect(result).toEqual({ enqueued: false });
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("skips when identified or exempt even with flag on", async () => {
    const admin = createMockSupabaseClient();
    await expect(
      enqueueCompanyIntelligenceRun(admin, {
        claimSubjectId: "subject-1",
        phoneNumberNormalized: "+18005551234",
        companyIdentified: true,
        isExempt: false,
        env: agentOn,
      }),
    ).resolves.toEqual({ enqueued: false });
    await expect(
      enqueueCompanyIntelligenceRun(admin, {
        claimSubjectId: "subject-1",
        phoneNumberNormalized: "+18005551234",
        companyIdentified: false,
        isExempt: true,
        env: agentOn,
      }),
    ).resolves.toEqual({ enqueued: false });
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("inserts pending run and updates subject when UNKNOWN", async () => {
    const runInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "run-uuid" },
          error: null,
        }),
      }),
    });
    const subjectUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const subjectUpdate = vi.fn().mockReturnValue({ eq: subjectUpdateEq });

    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockImplementation((table: string) => {
      if (table === "company_intelligence_runs") {
        return { insert: runInsert } as ReturnType<typeof admin.from>;
      }
      if (table === "claim_subjects") {
        return { update: subjectUpdate } as ReturnType<typeof admin.from>;
      }
      return {} as ReturnType<typeof admin.from>;
    });

    const result = await enqueueCompanyIntelligenceRun(admin, {
      claimSubjectId: "subject-1",
      phoneNumberNormalized: "+18005551234",
      companyIdentified: false,
      isExempt: false,
      env: agentOn,
    });

    expect(result).toEqual({ enqueued: true, runId: "run-uuid" });
    expect(runInsert).toHaveBeenCalledWith({
      claim_subject_id: "subject-1",
      phone_number_normalized: "+18005551234",
      status: "pending",
    });
    expect(subjectUpdate).toHaveBeenCalledWith({
      company_intel_status: "pending",
    });
    expect(subjectUpdateEq).toHaveBeenCalledWith("id", "subject-1");
  });
});

describe("maybeEnqueueCompanyIntelligenceRun (CI-1.1)", () => {
  it("triggers fail-open fetch when enqueue succeeds (CI-1.3.3)", async () => {
    const triggerSpy = vi
      .spyOn(triggerModule, "triggerCompanyIntelligenceRunFetch")
      .mockImplementation(() => {});

    const runInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "run-uuid" },
          error: null,
        }),
      }),
    });
    const subjectUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const subjectUpdate = vi.fn().mockReturnValue({ eq: subjectUpdateEq });

    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockImplementation((table: string) => {
      if (table === "company_intelligence_runs") {
        return { insert: runInsert } as ReturnType<typeof admin.from>;
      }
      if (table === "claim_subjects") {
        return { update: subjectUpdate } as ReturnType<typeof admin.from>;
      }
      return {} as ReturnType<typeof admin.from>;
    });

    await maybeEnqueueCompanyIntelligenceRun(admin, {
      claimSubjectId: "subject-1",
      phoneNumberNormalized: "+18005551234",
      companyIdentified: false,
      isExempt: false,
      env: agentOn,
    });

    expect(triggerSpy).toHaveBeenCalledWith({
      runId: "run-uuid",
      env: agentOn,
    });
    triggerSpy.mockRestore();
  });

  it("returns enqueued false on DB error without throwing", async () => {
    const runInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "insert failed" },
        }),
      }),
    });
    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockImplementation((table: string) => {
      if (table === "company_intelligence_runs") {
        return { insert: runInsert } as ReturnType<typeof admin.from>;
      }
      return {} as ReturnType<typeof admin.from>;
    });
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await maybeEnqueueCompanyIntelligenceRun(admin, {
      claimSubjectId: "subject-1",
      phoneNumberNormalized: "+18005551234",
      companyIdentified: false,
      isExempt: false,
      env: agentOn,
    });

    expect(result).toEqual({ enqueued: false });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
