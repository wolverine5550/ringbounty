import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { resolvePostMergeRedirectPath } from "./post-merge-redirect";

describe("resolvePostMergeRedirectPath", () => {
  it("returns /results with claim query param", async () => {
    const admin = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    } as unknown as SupabaseClient<Database>;

    Object.assign(admin.from("claim_subjects"), {
      select: vi.fn(function (this: unknown, _cols: string, opts?: { head?: boolean }) {
        if (opts?.head) {
          return {
            eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
          };
        }
        return {
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    });

    const chain = {
      select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.head) {
          return {
            eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
          };
        }
        return {
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    const adminMock = {
      from: vi.fn(() => chain),
    } as unknown as SupabaseClient<Database>;

    const path = await resolvePostMergeRedirectPath(
      adminMock,
      "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
    );

    expect(path).toBe(
      "/results?claim=aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
    );
  });

  it("includes subject id when exactly one subject exists", async () => {
    const subjectId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const claimId = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";

    const chain = {
      select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.head) {
          return {
            eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
          };
        }
        return {
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi
            .fn()
            .mockResolvedValue({ data: { id: subjectId }, error: null }),
        };
      }),
    };

    const admin = {
      from: vi.fn(() => chain),
    } as unknown as SupabaseClient<Database>;

    const path = await resolvePostMergeRedirectPath(admin, claimId);

    expect(path).toContain(`claim=${claimId}`);
    expect(path).toContain(`subject=${subjectId}`);
  });
});
