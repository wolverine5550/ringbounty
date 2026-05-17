import { afterEach, describe, expect, it } from "vitest";

import {
  absoluteUrl,
  getSiteOrigin,
  isSeoStagingEnvironment,
  normalizeSiteOrigin,
} from "./site-url";

describe("site-url (§11.4)", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("normalizes configured origins", () => {
    expect(normalizeSiteOrigin("https://ringbounty.com/")).toBe(
      "https://ringbounty.com",
    );
    expect(normalizeSiteOrigin("ringbounty.com")).toBe("https://ringbounty.com");
  });

  it("prefers NEXT_PUBLIC_SITE_URL", () => {
    process.env = {
      ...env,
      NEXT_PUBLIC_SITE_URL: "https://ringbounty.com",
      VERCEL_URL: "preview.vercel.app",
    };
    expect(getSiteOrigin()).toBe("https://ringbounty.com");
    expect(absoluteUrl("/faq")).toBe("https://ringbounty.com/faq");
  });

  it("detects preview staging for robots", () => {
    process.env = { ...env, VERCEL_ENV: "preview" };
    expect(isSeoStagingEnvironment()).toBe(true);
  });
});
