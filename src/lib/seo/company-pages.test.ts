import { describe, expect, it } from "vitest";

import {
  companySpamCallsPath,
  parseCompanySpamCallsPath,
  slugifyCompanyName,
} from "./company-pages";

describe("company-pages (§11.1)", () => {
  it("slugifies display names", () => {
    expect(slugifyCompanyName("CarShield")).toBe("carshield");
    expect(slugifyCompanyName("  DirecTV  ")).toBe("directv");
  });

  it("parses canonical company paths", () => {
    expect(parseCompanySpamCallsPath("carshield-spam-calls")).toBe("carshield");
    expect(parseCompanySpamCallsPath("carshield-spam-calls-compensation")).toBeNull();
    expect(parseCompanySpamCallsPath("tcpa-violation-checker")).toBeNull();
  });

  it("builds company path from slug", () => {
    expect(companySpamCallsPath("sunrun")).toBe("/sunrun-spam-calls");
  });
});
