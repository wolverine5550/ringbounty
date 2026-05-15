import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import {
  createOrGetActiveClaimForSession,
  DEFAULT_ANONYMOUS_VIOLATION_TYPE,
} from "./create-or-get-active-claim-for-session";

/** Builds a minimal fluent mock matching the select-then-maybeSingle read path. */
function mockSelectChain(existingId: string | null) {
  const maybeSingle = vi
    .fn()
    .mockResolvedValue({ data: existingId ? { id: existingId } : null, error: null });
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.is = vi.fn(() => chain);
  chain.maybeSingle = maybeSingle;
  return { chain, maybeSingle };
}

/** Builds insert().select('id').single() chain. */
function mockInsertChain(insertResult: {
  data: { id: string } | null;
  error: { code: string; message?: string } | null;
}) {
  const single = vi.fn().mockResolvedValue(insertResult);
  const selectAfterInsert = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select: selectAfterInsert }));
  return { insert, single, selectAfterInsert };
}

describe("createOrGetActiveClaimForSession", () => {
  const sessionId = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing draft claim id without calling insert", async () => {
    const read = mockSelectChain("claim-existing");
    const admin = {
      from: vi.fn(() => read.chain),
    } as unknown as SupabaseClient<Database>;

    const out = await createOrGetActiveClaimForSession(admin, sessionId);

    expect(out.claimId).toBe("claim-existing");
    expect(admin.from).toHaveBeenCalledWith("claims");
    expect(read.maybeSingle).toHaveBeenCalled();
  });

  it("inserts a draft row with expected shape when none exists", async () => {
    const read = mockSelectChain(null);
    const write = mockInsertChain({
      data: { id: "claim-new" },
      error: null,
    });

    let fromCalls = 0;
    const admin = {
      from: vi.fn((table: string) => {
        expect(table).toBe("claims");
        fromCalls += 1;
        if (fromCalls === 1) {
          return read.chain;
        }
        return {
          ...read.chain,
          insert: write.insert,
        };
      }),
    } as unknown as SupabaseClient<Database>;

    const out = await createOrGetActiveClaimForSession(admin, sessionId);

    expect(out.claimId).toBe("claim-new");
    expect(write.insert).toHaveBeenCalledTimes(1);
    expect(write.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        anonymous_session_id: sessionId,
        user_id: null,
        violation_type: DEFAULT_ANONYMOUS_VIOLATION_TYPE,
        status: "draft",
      }),
    );
  });

  it("re-selects after unique violation on concurrent insert", async () => {
    const readFirst = mockSelectChain(null);
    const write = mockInsertChain({
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });
    const readSecond = mockSelectChain("claim-after-race");

    let fromCalls = 0;
    const admin = {
      from: vi.fn(() => {
        fromCalls += 1;
        if (fromCalls === 1) {
          return readFirst.chain;
        }
        if (fromCalls === 2) {
          return {
            ...readFirst.chain,
            insert: write.insert,
          };
        }
        return readSecond.chain;
      }),
    } as unknown as SupabaseClient<Database>;

    const out = await createOrGetActiveClaimForSession(admin, sessionId);
    expect(out.claimId).toBe("claim-after-race");
    expect(admin.from).toHaveBeenCalledTimes(3);
  });
});
