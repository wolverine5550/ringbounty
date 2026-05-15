import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/types/database";

import { mergeAnonymousDraftOnLogin } from "./merge-anonymous-draft-on-login";

const authUserId = "11111111-1111-4111-8111-111111111111";
const sessionId = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
const anonymousClaimId = "22222222-2222-4222-8222-222222222222";
const ownedClaimId = "33333333-3333-4333-8333-333333333333";

type ClaimsMockConfig = {
  publicUserExists: boolean;
  ownedDraftId: string | null;
  anonymousDraftId: string | null;
  mergeResultId: string | null;
};

function createClaimsChain(config: ClaimsMockConfig, deleteEq: ReturnType<typeof vi.fn>) {
  let selectPurpose: "owned" | "anonymous" | "merge" | null = null;

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn((column: string) => {
    if (column === "user_id") {
      selectPurpose = "owned";
    }
    if (column === "anonymous_session_id") {
      selectPurpose = "anonymous";
    }
    return chain;
  });
  chain.is = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.update = vi.fn(() => {
    selectPurpose = "merge";
    return chain;
  });
  chain.delete = vi.fn(() => ({ eq: deleteEq }));
  chain.maybeSingle = vi.fn(async () => {
    if (selectPurpose === "owned") {
      return {
        data: config.ownedDraftId ? { id: config.ownedDraftId } : null,
        error: null,
      };
    }
    if (selectPurpose === "anonymous") {
      return {
        data: config.anonymousDraftId ? { id: config.anonymousDraftId } : null,
        error: null,
      };
    }
    if (selectPurpose === "merge") {
      return {
        data: config.mergeResultId ? { id: config.mergeResultId } : null,
        error: null,
      };
    }
    return { data: null, error: null };
  });
  return chain;
}

function mockAdmin(config: ClaimsMockConfig) {
  const deleteEq = vi.fn().mockResolvedValue({ error: null });
  const usersChain: Record<string, ReturnType<typeof vi.fn>> = {};
  usersChain.select = vi.fn(() => usersChain);
  usersChain.eq = vi.fn(() => usersChain);
  usersChain.maybeSingle = vi.fn().mockResolvedValue({
    data: config.publicUserExists ? { id: authUserId } : null,
    error: null,
  });
  usersChain.upsert = vi.fn().mockResolvedValue({ error: null });

  const claimsChain = createClaimsChain(config, deleteEq);

  const admin = {
    from: vi.fn((table: string) => {
      if (table === "users") return usersChain;
      if (table === "claims") return claimsChain;
      throw new Error(`unexpected table ${table}`);
    }),
    auth: {
      admin: {
        getUserById: vi.fn(),
      },
    },
  } as unknown as SupabaseClient<Database>;

  return { admin, deleteEq };
}

describe("mergeAnonymousDraftOnLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges anonymous draft when user has no owned draft", async () => {
    const { admin } = mockAdmin({
      publicUserExists: true,
      ownedDraftId: null,
      anonymousDraftId: anonymousClaimId,
      mergeResultId: anonymousClaimId,
    });

    const result = await mergeAnonymousDraftOnLogin(admin, {
      authUserId,
      anonymousSessionId: sessionId,
    });

    expect(result).toEqual({ mergedClaimId: anonymousClaimId });
  });

  it("abandons anonymous draft when user already has an owned draft", async () => {
    const { admin, deleteEq } = mockAdmin({
      publicUserExists: true,
      ownedDraftId: ownedClaimId,
      anonymousDraftId: anonymousClaimId,
      mergeResultId: null,
    });

    const result = await mergeAnonymousDraftOnLogin(admin, {
      authUserId,
      anonymousSessionId: sessionId,
    });

    expect(result).toEqual({
      mergedClaimId: ownedClaimId,
      collisionAbandoned: true,
    });
    expect(deleteEq).toHaveBeenCalledWith("id", anonymousClaimId);
  });

  it("returns owned draft when no anonymous draft exists", async () => {
    const { admin, deleteEq } = mockAdmin({
      publicUserExists: true,
      ownedDraftId: ownedClaimId,
      anonymousDraftId: null,
      mergeResultId: null,
    });

    const result = await mergeAnonymousDraftOnLogin(admin, {
      authUserId,
      anonymousSessionId: sessionId,
    });

    expect(result).toEqual({ mergedClaimId: ownedClaimId });
    expect(deleteEq).not.toHaveBeenCalled();
  });
});
