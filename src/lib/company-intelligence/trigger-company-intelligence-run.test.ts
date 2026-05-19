import { afterEach, describe, expect, it, vi } from "vitest";

import { triggerCompanyIntelligenceRunFetch } from "./trigger-company-intelligence-run";

describe("triggerCompanyIntelligenceRunFetch (CI-1.3.3)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("skips fetch when CRON_SECRET is unset", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    triggerCompanyIntelligenceRunFetch({ runId: "run-1", env: {} });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs to internal worker with bearer token (fail-open)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);

    triggerCompanyIntelligenceRunFetch({
      runId: "run-uuid",
      env: {
        CRON_SECRET: "test-secret",
        NEXT_PUBLIC_SITE_URL: "https://app.example.com",
      },
    });

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://app.example.com/api/internal/company-intelligence/run",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-secret",
        }),
        body: JSON.stringify({ run_id: "run-uuid" }),
      }),
    );
  });

  it("logs and does not throw when fetch rejects", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    triggerCompanyIntelligenceRunFetch({
      runId: "run-2",
      env: {
        CRON_SECRET: "secret",
        NEXT_PUBLIC_SITE_URL: "https://app.example.com",
      },
    });

    await vi.waitFor(() => {
      expect(logSpy).toHaveBeenCalled();
    });

    logSpy.mockRestore();
  });
});
