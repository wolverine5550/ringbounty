import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { vi } from "vitest";

export type { Database };

/** Minimal fluent chain returned by `from()` for common query patterns in tests. */
function createQueryChain() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return chain;
}

/**
 * Returns a typed `SupabaseClient` mock for unit tests.
 * Extend with `vi.mocked(client.auth.getUser)` etc. per test case.
 */
export function createMockSupabaseClient(): SupabaseClient<Database> {
  const client = {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn(() => createQueryChain()),
    channel: vi.fn(),
    removeChannel: vi.fn(),
    getChannels: vi.fn().mockReturnValue([]),
  };

  return client as unknown as SupabaseClient<Database>;
}
