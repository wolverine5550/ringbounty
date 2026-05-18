import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import {
  canReportFirmContactIssue,
  isFirmContactDisputeReason,
  normalizeFirmContactDisputeDetails,
  recordFirmContactDispute,
} from "./record-firm-contact-dispute";

describe("firm contact dispute helpers (§13.8)", () => {
  it("validates reason enum", () => {
    expect(isFirmContactDisputeReason("no_contact")).toBe(true);
    expect(isFirmContactDisputeReason("invalid")).toBe(false);
  });

  it("rejects details over max length", () => {
    expect(normalizeFirmContactDisputeDetails("a".repeat(2001))).toBeNull();
    expect(normalizeFirmContactDisputeDetails("ok")).toBe("ok");
  });

  it("canReportFirmContactIssue requires assigned firm and eligible status", () => {
    expect(
      canReportFirmContactIssue({
        status: "accepted",
        assignedFirmId: "firm-1",
        disputeSubmitted: false,
      }),
    ).toBe(true);
    expect(
      canReportFirmContactIssue({
        status: "new",
        assignedFirmId: "firm-1",
        disputeSubmitted: false,
      }),
    ).toBe(false);
    expect(
      canReportFirmContactIssue({
        status: "accepted",
        assignedFirmId: null,
        disputeSubmitted: false,
      }),
    ).toBe(false);
  });
});

describe("recordFirmContactDispute (§13.8.1)", () => {
  it("returns not_eligible when lead is not accepted", async () => {
    const userSb = createMockSupabaseClient();
    const admin = createMockSupabaseClient();

    vi.mocked(userSb.from).mockImplementation(((table: string) => {
      if (table === "leads") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: "lead-1",
              claim_id: "claim-1",
              user_id: "user-1",
              status: "new",
              assigned_firm_id: null,
            },
            error: null,
          }),
        } as never;
      }
      throw new Error(`unexpected ${table}`);
    }) as typeof userSb.from);

    const result = await recordFirmContactDispute(userSb, admin, {
      leadId: "lead-1",
      userId: "user-1",
      userEmail: "u@example.com",
      reason: "no_contact",
    });

    expect(result).toEqual({ recorded: false, reason: "not_eligible" });
  });

  it("inserts claim_events when eligible", async () => {
    const userSb = createMockSupabaseClient();
    const admin = createMockSupabaseClient();
    let userCall = 0;

    vi.mocked(userSb.from).mockImplementation(((table: string) => {
      if (table === "leads") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: "lead-1",
              claim_id: "claim-1",
              user_id: "user-1",
              status: "accepted",
              assigned_firm_id: "firm-1",
            },
            error: null,
          }),
        } as never;
      }
      if (table === "claim_events") {
        userCall += 1;
        if (userCall === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as never;
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        } as never;
      }
      throw new Error(`unexpected ${table}`);
    }) as typeof userSb.from);

    vi.mocked(admin.from).mockImplementation(((table: string) => {
      if (table === "law_firms") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { name: "Test Firm" },
            error: null,
          }),
        } as never;
      }
      if (table === "claim_events") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        } as never;
      }
      throw new Error(`unexpected admin ${table}`);
    }) as typeof admin.from);

    vi.stubEnv("OPS_DISPUTE_EMAIL", "");

    const result = await recordFirmContactDispute(userSb, admin, {
      leadId: "lead-1",
      userId: "user-1",
      userEmail: "u@example.com",
      reason: "no_contact",
      details: "Still waiting",
    });

    expect(result).toEqual({ recorded: true });
  });
});
