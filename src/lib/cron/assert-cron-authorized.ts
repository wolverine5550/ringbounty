import { type NextRequest, NextResponse } from "next/server";

/**
 * Validates `Authorization: Bearer $CRON_SECRET` for cron/internal workers.
 * Returns a 401/503 response, or `null` when authorized.
 */
export function assertCronAuthorized(
  request: NextRequest,
): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json(
      { error: "Cron API is not configured on this host" },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;

  if (!token || token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
