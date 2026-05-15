import { describe, expect, it } from "vitest";

import {
  getSpamProviderFeatureFlags,
  parseBooleanEnv,
  SPAM_PROVIDER_TWILIO_ENV_KEY,
  SPAM_PROVIDER_YOUMAIL_ENV_KEY,
} from "./provider-flags";

describe("parseBooleanEnv", () => {
  it("treats empty and undefined as false", () => {
    expect(parseBooleanEnv(undefined)).toBe(false);
    expect(parseBooleanEnv("")).toBe(false);
    expect(parseBooleanEnv("   ")).toBe(false);
  });

  it("accepts true / 1 / yes (case-insensitive)", () => {
    expect(parseBooleanEnv("true")).toBe(true);
    expect(parseBooleanEnv("TRUE")).toBe(true);
    expect(parseBooleanEnv("1")).toBe(true);
    expect(parseBooleanEnv("yes")).toBe(true);
    expect(parseBooleanEnv(" Yes ")).toBe(true);
  });

  it("treats other strings as false", () => {
    expect(parseBooleanEnv("false")).toBe(false);
    expect(parseBooleanEnv("0")).toBe(false);
    expect(parseBooleanEnv("no")).toBe(false);
    expect(parseBooleanEnv("foo")).toBe(false);
  });
});

describe("getSpamProviderFeatureFlags", () => {
  it("reads both env keys from a supplied env object", () => {
    const flags = getSpamProviderFeatureFlags({
      [SPAM_PROVIDER_TWILIO_ENV_KEY]: "true",
      [SPAM_PROVIDER_YOUMAIL_ENV_KEY]: "0",
    });
    expect(flags.twilioEnabled).toBe(true);
    expect(flags.youmailEnabled).toBe(false);
  });

  it("defaults both off when keys absent", () => {
    const flags = getSpamProviderFeatureFlags({});
    expect(flags.twilioEnabled).toBe(false);
    expect(flags.youmailEnabled).toBe(false);
  });
});
