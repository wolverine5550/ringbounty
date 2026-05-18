import { type NextRequest, NextResponse } from "next/server";

import {
  FIRM_LEAD_STATUS_TARGETS,
  updateFirmLeadStatus,
  type FirmLeadStatusTarget,
} from "@/lib/firms/update-firm-lead-status";
import { loadFirmUserMembership } from "@/lib/firms/load-firm-user-membership";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ leadId: string }> };

/**
 * §13.6.1 — Mark assigned lead as contacted, retained, or closed.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { leadId } = await context.params;
  const trimmedLeadId = leadId?.trim();
  if (!trimmedLeadId) {
    return NextResponse.json({ error: "lead_id is required" }, { status: 400 });
  }

  let body: { status?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status = body.status?.trim() as FirmLeadStatusTarget | undefined;
  if (!status || !FIRM_LEAD_STATUS_TARGETS.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${FIRM_LEAD_STATUS_TARGETS.join(", ")}` },
      { status: 400 },
    );
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
    const result = await updateFirmLeadStatus(supabase, {
      leadId: trimmedLeadId,
      firmId: membership.firmId,
      status,
    });

    if (!result.updated) {
      if (result.reason === "invalid_transition") {
        return NextResponse.json(
          { error: "Status cannot be updated from the current state" },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: "Lead not found or not assigned to you" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, status: result.status });
  } catch (e) {
    console.error("PATCH /api/firms/leads/[leadId]/status", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
