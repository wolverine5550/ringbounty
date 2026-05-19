import { describe, expect, it } from "vitest";

import { parseEnvFile } from "./load-local-env";

describe("parseEnvFile", () => {
  it("parses KEY=VALUE and skips comments", () => {
    const parsed = parseEnvFile(`
# comment
SUPABASE_SECRET_KEY=sb_secret_test
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
`);
    expect(parsed.SUPABASE_SECRET_KEY).toBe("sb_secret_test");
    expect(parsed.NEXT_PUBLIC_SUPABASE_URL).toBe(
      "https://example.supabase.co",
    );
  });

  it("strips double quotes", () => {
    expect(parseEnvFile('FOO="bar baz"').FOO).toBe("bar baz");
  });
});
