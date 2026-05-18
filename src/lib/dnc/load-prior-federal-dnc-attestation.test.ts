import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { loadPriorFederalDncAttestationForUser } from "./load-prior-federal-dnc-attestation";

describe("loadPriorFederalDncAttestationForUser", () => {
  it("returns null when user has no other subjects with attestation", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "claims") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({ data: [{ id: "claim-1" }], error: null }),
              ),
            })),
          };
        }
        if (table === "claim_subjects") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                neq: vi.fn(() =>
                  Promise.resolve({
                    data: [{ id: "sub-other", metadata: {} }],
                    error: null,
                  }),
                ),
              })),
            })),
          };
        }
        if (table === "dnc_check_results") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                not: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() =>
                      Promise.resolve({ data: [], error: null }),
                    ),
                  })),
                })),
              })),
            })),
          };
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await loadPriorFederalDncAttestationForUser(supabase, {
      userId: "user-1",
      excludeClaimSubjectId: "sub-new",
    });

    expect(result).toBeNull();
  });

  it("returns prior attestation from any claim subject for the user", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "claims") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  data: [{ id: "claim-a" }, { id: "claim-b" }],
                  error: null,
                }),
              ),
            })),
          };
        }
        if (table === "claim_subjects") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                neq: vi.fn(() =>
                  Promise.resolve({
                    data: [
                      {
                        id: "sub-prior",
                        metadata: {
                          federal_dnc_confirmation_screenshot_path:
                            "user/claim/sub-prior/federal-dnc-confirmation.pdf",
                        },
                      },
                    ],
                    error: null,
                  }),
                ),
              })),
            })),
          };
        }
        if (table === "dnc_check_results") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                not: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() =>
                      Promise.resolve({
                        data: [
                          {
                            claim_subject_id: "sub-prior",
                            federal_dnc_registered: true,
                            federal_dnc_registration_date: "2024-01-15",
                            federal_dnc_checked_at: "2026-05-18T12:00:00Z",
                          },
                        ],
                        error: null,
                      }),
                    ),
                  })),
                })),
              })),
            })),
          };
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await loadPriorFederalDncAttestationForUser(supabase, {
      userId: "user-1",
      excludeClaimSubjectId: "sub-new",
    });

    expect(result).toEqual({
      attestation: {
        federalDncRegistered: true,
        federalDncRegistrationDate: "2024-01-15",
      },
      confirmationScreenshotPath:
        "user/claim/sub-prior/federal-dnc-confirmation.pdf",
      sourceClaimSubjectId: "sub-prior",
    });
  });
});
