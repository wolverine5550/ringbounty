import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import { enqueueQualifyCallbackIntelligenceRun } from "./enqueue-qualify-callback-intelligence-run";
import * as triggerModule from "./trigger-company-intelligence-run";

const agentOn = { COMPANY_INTELLIGENCE_AGENT_ENABLED: "true" };

describe("enqueueQualifyCallbackIntelligenceRun (CI-6.2)", () => {
  it("enqueues child run linked to latest top-level parent", async () => {
    vi.spyOn(triggerModule, "triggerCompanyIntelligenceRunFetch").mockImplementation(
      () => {},
    );

    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "child-run" }, error: null }),
      }),
    });

    const existsLimit = vi.fn().mockResolvedValue({ data: [], error: null });
    const existsIn = vi.fn().mockReturnValue({ limit: existsLimit });
    const existsSecondEq = vi.fn().mockReturnValue({ in: existsIn });

    const parentMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "parent-run" },
      error: null,
    });
    const parentLimit = vi.fn().mockReturnValue({ maybeSingle: parentMaybeSingle });
    const parentOrder = vi.fn().mockReturnValue({ limit: parentLimit });
    const parentIs = vi.fn().mockReturnValue({ order: parentOrder });
    const childCountEq = vi.fn().mockResolvedValue({ count: 0, error: null });

    let intelEqPass = 0;
    const selectFirstEq = vi.fn().mockImplementation(() => {
      intelEqPass += 1;
      if (intelEqPass === 1) {
        return { eq: existsSecondEq };
      }
      if (intelEqPass === 2) {
        return { is: parentIs };
      }
      return childCountEq;
    });
    const intelSelect = vi.fn().mockReturnValue({ eq: selectFirstEq });

    const subjectMaybeSingle = vi.fn().mockResolvedValue({
      data: { company_identified: false, is_exempt: false },
      error: null,
    });
    const subjectEq = vi.fn().mockReturnValue({ maybeSingle: subjectMaybeSingle });
    const subjectSelect = vi.fn().mockReturnValue({ eq: subjectEq });

    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockImplementation((table: string) => {
      if (table === "claim_subjects") {
        return { select: subjectSelect } as ReturnType<typeof admin.from>;
      }
      if (table === "company_intelligence_runs") {
        return {
          select: intelSelect,
          insert,
        } as ReturnType<typeof admin.from>;
      }
      return {} as ReturnType<typeof admin.from>;
    });

    const result = await enqueueQualifyCallbackIntelligenceRun({
      admin,
      claimSubjectId: "subject-1",
      subjectPhoneNormalized: "+18005551234",
      callbackPhoneRaw: "800-555-9999",
      requireSubjectUnidentified: true,
      trigger: "screen_4_save",
      env: agentOn,
    });

    expect(result).toEqual({
      enqueued: true,
      runId: "child-run",
      callbackE164: "+18005559999",
    });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        parent_run_id: "parent-run",
        phone_number_normalized: "+18005559999",
      }),
    );
  });

  it("skips when subject already identified (CI-6.2.2)", async () => {
    const subjectMaybeSingle = vi.fn().mockResolvedValue({
      data: { company_identified: true, is_exempt: false },
      error: null,
    });
    const subjectEq = vi.fn().mockReturnValue({ maybeSingle: subjectMaybeSingle });
    const subjectSelect = vi.fn().mockReturnValue({ eq: subjectEq });

    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockImplementation((table: string) => {
      if (table === "claim_subjects") {
        return { select: subjectSelect } as ReturnType<typeof admin.from>;
      }
      return {} as ReturnType<typeof admin.from>;
    });

    const result = await enqueueQualifyCallbackIntelligenceRun({
      admin,
      claimSubjectId: "subject-1",
      subjectPhoneNormalized: "+18005551234",
      callbackPhoneRaw: "+18005559999",
      requireSubjectUnidentified: true,
      trigger: "screen_4_save",
      env: agentOn,
    });

    expect(result).toEqual({ enqueued: false, reason: "subject_identified" });
  });
});
