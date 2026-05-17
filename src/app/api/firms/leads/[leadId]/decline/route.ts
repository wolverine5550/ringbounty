import { type NextRequest, NextResponse } from "next/server";

import { declineFirmLead } from "@/lib/firms/decline-firm-lead";
import { loadFirmUserMembership } from "@/lib/firms/load-firm-user-membership";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ leadId: string }> };

/**
 * §13.5.3 — Decline a pool lead for this firm (optional reason).
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { leadId } = await context.params;
  const trimmedLeadId = leadId?.trim();
  if (!trimmedLeadId) {
    return NextResponse.json({ error: "lead_id is required" }, { status: 400 });
  }

  let body: { reason?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const membership = await loadFirmUserMembership(supabase, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Firm portal access required" }, { status: 403 });
  }

  try {
    const result = await declineFirmLead(supabase, {
      firmId: membership.firmId,
      leadId: trimmedLeadId,
      reason: body.reason,
    });

    if (!result.declined) {
      return NextResponse.json(
        { error: "Lead not found or not in your pool" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/firms/leads/[leadId]/decline", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
