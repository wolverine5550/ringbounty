/**
 * §2.7.3 — Server-side logging when a client hits a rate limit.
 */
export function logRateLimitIncident(details: {
  action: string;
  scope: string;
  bucketKey: string;
  currentCount: number;
  clientIp: string;
  anonymousSessionId?: string;
}): void {
  console.error("[rate-limit]", {
    ...details,
    at: new Date().toISOString(),
  });
}
