import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import { loadCallbackResolvedFromBySubject } from "./load-callback-resolved-from-by-subject";

describe("loadCallbackResolvedFromBySubject (CI-6.2.3)", () => {
  it("returns latest callback_resolved_from per subject", async () => {
    const intelIn = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              claim_subject_id: "sub-1",
              run_metadata: { callback_resolved_from: "+18005559999" },
              updated_at: "2026-05-20T00:00:00Z",
            },
            {
              claim_subject_id: "sub-2",
              run_metadata: {},
              updated_at: "2026-05-19T00:00:00Z",
            },
          ],
          error: null,
        }),
      }),
    });
    const intelSelect = vi.fn().mockReturnValue({ in: intelIn });

    const admin = createMockSupabaseClient();
    vi.mocked(admin.from).mockReturnValue({
      select: intelSelect,
    } as ReturnType<typeof admin.from>);

    const map = await loadCallbackResolvedFromBySubject(admin, [
      "sub-1",
      "sub-2",
    ]);

    expect(map.get("sub-1")).toBe("+18005559999");
    expect(map.has("sub-2")).toBe(false);
  });
});
