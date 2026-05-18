import { type NextRequest, NextResponse } from "next/server";

import { sendFirmLeadStatusReminders } from "@/lib/firms/send-firm-lead-status-reminders";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";

/**
 * §13.6.3 — Cron hook: remind firms to update stale `accepted` leads.
 * Secured with `CRON_SECRET` bearer token (schedule via Vercel Cron or external scheduler).
 */
export async function POST(request: NextRequest) {
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

  try {
    const admin = createAdminClient();
    const result = await sendFirmLeadStatusReminders(admin);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof SupabaseAdminKeyMissingError) {
      return NextResponse.json(
        { error: "Database admin is not configured" },
        { status: 503 },
      );
    }
    console.error("POST /api/cron/firm-lead-status-reminder", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
