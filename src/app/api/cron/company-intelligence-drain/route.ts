import { type NextRequest, NextResponse } from "next/server";

import { processCompanyIntelligenceRuns } from "@/lib/company-intelligence/process-company-intelligence-run";
import {
  clampCronBatchSize,
  resolveCronBatchSizeFromEnv,
} from "@/lib/company-intelligence/worker-policy";
import { assertCronAuthorized } from "@/lib/cron/assert-cron-authorized";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";

type DrainRequestBody = {
  batch_size?: number;
};

/**
 * CI-1.3.1 — Cron drain: claim up to N pending runs and process each.
 * Vercel Cron invokes GET with `Authorization: Bearer $CRON_SECRET` (see vercel.json).
 * External schedulers may use POST with the same auth.
 */
async function handleDrain(request: NextRequest): Promise<NextResponse> {
  const denied = assertCronAuthorized(request);
  if (denied) {
    return denied;
  }

  let batchSize = resolveCronBatchSizeFromEnv();
  if (request.method === "POST") {
    try {
      const text = await request.text();
      if (text.trim()) {
        const body = JSON.parse(text) as DrainRequestBody;
        if (body.batch_size !== undefined) {
          batchSize = clampCronBatchSize(body.batch_size);
        }
      }
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  }

  try {
    const admin = createAdminClient();
    const result = await processCompanyIntelligenceRuns(admin, { batchSize });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof SupabaseAdminKeyMissingError) {
      return NextResponse.json(
        { error: "Database admin is not configured" },
        { status: 503 },
      );
    }
    console.error("/api/cron/company-intelligence-drain", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleDrain(request);
}

export async function POST(request: NextRequest) {
  return handleDrain(request);
}
