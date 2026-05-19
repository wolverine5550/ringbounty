import { describe, expect, it } from "vitest";

import {
  COMPANY_INTEL_CRON_BATCH_SIZE_DEFAULT,
  COMPANY_INTEL_CRON_BATCH_SIZE_MAX,
  COMPANY_INTEL_MAX_ATTEMPTS,
  clampCronBatchSize,
  computeRetryDelaySeconds,
  resolveCronBatchSizeFromEnv,
  shouldPermanentlyFail,
} from "./worker-policy";

describe("computeRetryDelaySeconds (CI-P.6.3)", () => {
  it("returns 0 for attemptCount < 1", () => {
    expect(computeRetryDelaySeconds(0)).toBe(0);
  });

  it("uses 60s, 120s, 240s for attempts 1–3", () => {
    expect(computeRetryDelaySeconds(1)).toBe(60);
    expect(computeRetryDelaySeconds(2)).toBe(120);
    expect(computeRetryDelaySeconds(3)).toBe(240);
  });
});

describe("shouldPermanentlyFail (CI-P.6.3)", () => {
  it("fails permanently at max attempts", () => {
    expect(shouldPermanentlyFail(COMPANY_INTEL_MAX_ATTEMPTS - 1)).toBe(false);
    expect(shouldPermanentlyFail(COMPANY_INTEL_MAX_ATTEMPTS)).toBe(true);
    expect(shouldPermanentlyFail(COMPANY_INTEL_MAX_ATTEMPTS + 1)).toBe(true);
  });
});

describe("resolveCronBatchSizeFromEnv (CI-1.3)", () => {
  it("uses default when env unset", () => {
    expect(resolveCronBatchSizeFromEnv({})).toBe(
      COMPANY_INTEL_CRON_BATCH_SIZE_DEFAULT,
    );
  });

  it("parses COMPANY_INTEL_CRON_BATCH_SIZE", () => {
    expect(
      resolveCronBatchSizeFromEnv({ COMPANY_INTEL_CRON_BATCH_SIZE: "10" }),
    ).toBe(10);
    expect(
      resolveCronBatchSizeFromEnv({ COMPANY_INTEL_CRON_BATCH_SIZE: "99" }),
    ).toBe(COMPANY_INTEL_CRON_BATCH_SIZE_MAX);
  });
});

describe("clampCronBatchSize (CI-P.6.1)", () => {
  it("defaults invalid input", () => {
    expect(clampCronBatchSize(Number.NaN)).toBe(
      COMPANY_INTEL_CRON_BATCH_SIZE_DEFAULT,
    );
  });

  it("clamps to 1..max", () => {
    expect(clampCronBatchSize(0)).toBe(1);
    expect(clampCronBatchSize(999)).toBe(COMPANY_INTEL_CRON_BATCH_SIZE_MAX);
    expect(clampCronBatchSize(5)).toBe(5);
  });
});
