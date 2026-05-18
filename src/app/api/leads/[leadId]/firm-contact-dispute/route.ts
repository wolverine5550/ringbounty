import { type NextRequest, NextResponse } from "next/server";

import {
  isFirmContactDisputeReason,
  recordFirmContactDispute,
} from "@/lib/leads/record-firm-contact-dispute";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ leadId: string }> };

/**
 * §13.8.1 — Consumer reports an issue with firm contact; persists `claim_events`.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { leadId } = await context.params;
  const trimmedLeadId = leadId?.trim();

  if (!trimmedLeadId) {
    return NextResponse.json({ error: "leadId is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const reason = record.reason;
  const details =
    typeof record.details === "string" ? record.details : undefined;

  if (!isFirmContactDisputeReason(reason)) {
    return NextResponse.json({ error: "Invalid or missing reason" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const result = await recordFirmContactDispute(supabase, admin, {
      leadId: trimmedLeadId,
      userId: user.id,
      userEmail: user.email,
      reason,
      details,
    });

    if (!result.recorded) {
      const status =
        result.reason === "lead_not_found" || result.reason === "not_owner"
          ? 404
          : result.reason === "already_submitted"
            ? 409
            : 400;

      return NextResponse.json({ error: result.reason }, { status });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof SupabaseAdminKeyMissingError) {
      return NextResponse.json(
        { error: "Dispute API is not configured on this host" },
        { status: 503 },
      );
    }
    console.error("POST /api/leads/[leadId]/firm-contact-dispute", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
