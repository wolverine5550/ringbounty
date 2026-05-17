import { afterEach, describe, expect, it } from "vitest";

import { resolveSiteOrigin } from "./resolve-site-origin";

describe("resolveSiteOrigin (§13.3.2)", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("prefers NEXT_PUBLIC_SITE_URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://ringbounty.com/";
    process.env.VERCEL_URL = "preview.vercel.app";
    expect(resolveSiteOrigin()).toBe("https://ringbounty.com");
  });

  it("falls back to localhost when unset", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;
    expect(resolveSiteOrigin()).toBe("http://localhost:3000");
  });
});
