import { describe, expect, it } from "vitest";

import { getClientIp } from "./get-client-ip";

function mockRequest(headers: Record<string, string>) {
  return {
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
  } as import("next/server").NextRequest;
}

describe("getClientIp", () => {
  it("reads the first x-forwarded-for hop", () => {
    expect(
      getClientIp(
        mockRequest({ "x-forwarded-for": "203.0.113.1, 10.0.0.1" }),
      ),
    ).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip", () => {
    expect(getClientIp(mockRequest({ "x-real-ip": "198.51.100.2" }))).toBe(
      "198.51.100.2",
    );
  });

  it("returns unknown when headers are missing", () => {
    expect(getClientIp(mockRequest({}))).toBe("unknown");
  });
});
