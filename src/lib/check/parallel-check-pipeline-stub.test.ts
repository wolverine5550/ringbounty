import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CHECK_PIPELINE_STUB_PROVIDER_IDS,
  runStubChecksForPhoneList,
  runStubProvidersForPhone,
} from "./parallel-check-pipeline-stub";

describe("parallel-check-pipeline-stub", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs all stub providers successfully in parallel", async () => {
    const out = await runStubProvidersForPhone("+12125550199");
    expect(out).toHaveLength(CHECK_PIPELINE_STUB_PROVIDER_IDS.length);
    expect(out.every((p) => p.status === "ok")).toBe(true);
  });

  it("marks had_provider_failure when a provider is configured to fail", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const rows = await runStubChecksForPhoneList(
      [{ phoneNumberNormalized: "+12125550199", subjectId: "sub-1" }],
      { failProviderId: "nomorobo_stub" },
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.had_provider_failure).toBe(true);
    const nomorobo = rows[0]?.providers.find(
      (p) => p.provider_id === "nomorobo_stub",
    );
    expect(nomorobo?.status).toBe("error");
    if (nomorobo && nomorobo.status === "error") {
      expect(nomorobo.error_code).toBe("STUB_PROVIDER_UNAVAILABLE");
    }
    const twilio = rows[0]?.providers.find((p) => p.provider_id === "twilio_stub");
    expect(twilio?.status).toBe("ok");
    expect(spy).toHaveBeenCalled();
    const payload = JSON.parse(String(spy.mock.calls[0]?.[0]));
    expect(payload.event).toBe("check_provider_failure");
    expect(payload.error_code).toBe("STUB_PROVIDER_UNAVAILABLE");
  });
});
