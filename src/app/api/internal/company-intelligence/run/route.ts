import { type NextRequest, NextResponse } from "next/server";

import { assertCronAuthorized } from "@/lib/cron/assert-cron-authorized";
import { processCompanyIntelligenceRuns } from "@/lib/company-intelligence/process-company-intelligence-run";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";

type RunRequestBody = {
  run_id?: string;
  batch_size?: number;
};

/**
 * CI-1.2 — Internal worker: process one `run_id` or claim a pending batch via RPC.
 * Secured with `CRON_SECRET` (same as firm lead reminder cron).
 */
export async function POST(request: NextRequest) {
  const denied = assertCronAuthorized(request);
  if (denied) {
    return denied;
  }

  let body: RunRequestBody = {};
  try {
    const text = await request.text();
    if (text.trim()) {
      body = JSON.parse(text) as RunRequestBody;
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const result = await processCompanyIntelligenceRuns(admin, {
      runId: body.run_id,
      batchSize: body.batch_size,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof SupabaseAdminKeyMissingError) {
      return NextResponse.json(
        { error: "Database admin is not configured" },
        { status: 503 },
      );
    }
    console.error("POST /api/internal/company-intelligence/run", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
