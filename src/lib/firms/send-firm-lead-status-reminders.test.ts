import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import { sendFirmLeadStatusReminders } from "./send-firm-lead-status-reminders";

describe("sendFirmLeadStatusReminders (§13.6.3)", () => {
  it("marks reminder sent when Resend is not configured", async () => {
    const admin = createMockSupabaseClient();
    vi.stubEnv("RESEND_API_KEY", "");

    let leadsCall = 0;

    vi.mocked(admin.from).mockImplementation(((table: string) => {
      if (table === "leads") {
        leadsCall += 1;
        if (leadsCall === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            not: vi.fn().mockReturnThis(),
            lt: vi.fn().mockResolvedValue({
              data: [{ id: "lead-1", assigned_firm_id: "firm-1" }],
              error: null,
            }),
          } as never;
        }
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        } as never;
      }
      if (table === "firm_users") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{ email: "lawyer@example.com" }],
            error: null,
          }),
        } as never;
      }
      throw new Error(`unexpected table ${table}`);
    }) as typeof admin.from);

    const result = await sendFirmLeadStatusReminders(admin);

    expect(result).toEqual({
      candidates: 1,
      emailed: 0,
      skippedNotConfigured: 1,
    });

    vi.unstubAllEnvs();
  });
});
