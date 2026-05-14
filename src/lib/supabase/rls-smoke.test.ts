import { createClient } from "@supabase/supabase-js";
import { describe, expect, test } from "vitest";
import type { Database } from "@/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userAccessToken = process.env.VITEST_SUPABASE_USER_ACCESS_TOKEN;

const hasAnonContext = Boolean(url && publishableKey);

function createAnonRoleClient() {
  return createClient<Database>(url!, publishableKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function createServiceRoleClient() {
  return createClient<Database>(url!, serviceRoleKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function createClientWithUserJwt(accessToken: string) {
  return createClient<Database>(url!, publishableKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

describe("RLS smoke against hosted project (optional env)", () => {
  describe.skipIf(!hasAnonContext)("anon / publishable key (no user JWT)", () => {
    test("claims: anon role has no table grant — expect PostgREST error", async () => {
      const sb = createAnonRoleClient();
      const { data, error } = await sb.from("claims").select("id").limit(1);
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });

    test("leads: anon role has no table grant — expect PostgREST error", async () => {
      const sb = createAnonRoleClient();
      const { data, error } = await sb.from("leads").select("id").limit(1);
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });

    test("violation_types: catalog remains readable for anon where granted", async () => {
      const sb = createAnonRoleClient();
      const { data, error } = await sb.from("violation_types").select("id").limit(1);
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe.skipIf(!url || !serviceRoleKey)("service_role key bypasses RLS", () => {
    test("leads select does not fail for permission denied", async () => {
      const sb = createServiceRoleClient();
      const { error } = await sb.from("leads").select("id").limit(1);
      expect(error).toBeNull();
    });
  });

  describe.skipIf(!hasAnonContext || !userAccessToken)(
    "authenticated JWT passed via Authorization header",
    () => {
      test("users self-select uses auth.uid() from JWT", async () => {
        const sb = createClientWithUserJwt(userAccessToken!);
        const { error } = await sb.from("users").select("id").limit(1);
        expect(error).toBeNull();
      });
    },
  );
});
