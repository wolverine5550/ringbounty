import { describe, expect, it } from "vitest";

import {
  collectOkSpamResults,
  runSpamChecks,
} from "./run-spam-checks";
import type { SpamCheckProvider, SpamCheckResult } from "./types";

function stubProvider(
  id: string,
  impl: (phone: string) => Promise<SpamCheckResult>,
): SpamCheckProvider {
  return {
    async check(phone: string) {
      const result = await impl(phone);
      return { ...result, providerId: id };
    },
  };
}

describe("runSpamChecks", () => {
  it("runs providers in parallel and returns ok results", async () => {
    const outcomes = await runSpamChecks("+12125550199", {
      providers: [
        stubProvider("nomorobo", async () => ({
          isSpam: true,
          score: 90,
          complaints: 1,
          category: "robocall",
          companyName: null,
          raw: {},
          providerId: "nomorobo",
        })),
        stubProvider("twilio", async () => ({
          isSpam: false,
          score: 50,
          complaints: null,
          category: null,
          companyName: null,
          raw: {},
          providerId: "twilio",
        })),
      ],
    });
    expect(outcomes).toHaveLength(2);
    expect(outcomes.every((o) => o.status === "ok")).toBe(true);
    const results = collectOkSpamResults(outcomes);
    expect(results).toHaveLength(2);
  });

  it("returns error for one provider without failing the other", async () => {
    const outcomes = await runSpamChecks("+12125550199", {
      providers: [
        stubProvider("nomorobo", async () => {
          throw new Error("network");
        }),
        stubProvider("twilio", async () => ({
          isSpam: false,
          score: null,
          complaints: null,
          category: null,
          companyName: null,
          raw: { skipped: true, reason: "disabled" },
          providerId: "twilio",
        })),
      ],
    });
    expect(outcomes[0]?.status).toBe("error");
    expect(outcomes[1]?.status).toBe("ok");
  });

  it("does not call global fetch when using default factories with flags off", async () => {
    const outcomes = await runSpamChecks("+12125550199", {
      env: {
        SPAM_PROVIDER_NOMOROBO_ENABLED: "false",
        SPAM_PROVIDER_TWILIO_ENABLED: "false",
      },
    });
    expect(outcomes.every((o) => o.status === "ok")).toBe(true);
    const results = collectOkSpamResults(outcomes);
    expect(results.every((r) => r.isSpam === false)).toBe(true);
    expect(
      results.every(
        (r) =>
          typeof r.raw === "object" &&
          r.raw !== null &&
          "skipped" in r.raw &&
          (r.raw as { skipped: boolean }).skipped === true,
      ),
    ).toBe(true);
  });
});
