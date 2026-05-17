import { describe, expect, it } from "vitest";

import {
  parseQualifyScreen2Body,
  parseStopRequestDate,
  resolveInternalDncFieldsFromScreen2,
} from "./screen-2-stop-request";

describe("screen-2-stop-request (§7.3)", () => {
  it("rejects future stop_request_date", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const iso = future.toISOString().slice(0, 10);
    expect(parseStopRequestDate(iso)).toEqual({
      error: "stop_request_date cannot be in the future",
    });
  });

  it("accepts today as stop_request_date", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(parseStopRequestDate(today)).toBe(today);
  });

  it("maps internal_dnc when stop request with post-stop calls", () => {
    expect(
      resolveInternalDncFieldsFromScreen2({
        stopRequestMade: true,
        stopRequestMethod: "verbal",
        stopRequestDate: "2023-06-01",
        callsAfterStopRequest: true,
      }),
    ).toEqual({
      internal_dnc_violated: true,
      internal_dnc_stop_request_method: "verbal",
      internal_dnc_stop_request_date: "2023-06-01",
    });
  });

  it("maps internal_dnc when no stop request", () => {
    expect(
      resolveInternalDncFieldsFromScreen2({
        stopRequestMade: false,
        stopRequestMethod: null,
        stopRequestDate: null,
        callsAfterStopRequest: null,
      }),
    ).toEqual({
      internal_dnc_violated: false,
      internal_dnc_stop_request_method: null,
      internal_dnc_stop_request_date: null,
    });
  });

  it("parses valid API body when stop request made", () => {
    const parsed = parseQualifyScreen2Body({
      stop_request_made: true,
      stop_request_method: "text_stop",
      stop_request_date: "2023-06-01",
      calls_after_stop_request: false,
    });
    expect("error" in parsed).toBe(false);
    if (!("error" in parsed)) {
      expect(parsed.stopRequestMethod).toBe("text_stop");
      expect(parsed.callsAfterStopRequest).toBe(false);
    }
  });

  it("parses API body when no stop request", () => {
    const parsed = parseQualifyScreen2Body({ stop_request_made: false });
    expect(parsed).toEqual({
      stopRequestMade: false,
      stopRequestMethod: null,
      stopRequestDate: null,
      callsAfterStopRequest: null,
    });
  });
});
