import { type NextRequest, NextResponse } from "next/server";

import { inviteFirmUser } from "@/lib/firms/invite-firm-user";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";

/**
 * Phase 13.4.2 — Ops invite for firm portal users (server-only secret).
 * Body: `{ firm_id, email, full_name? }`
 */
export async function POST(request: NextRequest) {
  const opsSecret = process.env.FIRM_OPS_INVITE_SECRET?.trim();
  if (!opsSecret) {
    return NextResponse.json(
      { error: "Firm invite API is not configured on this host" },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;

  if (!token || token !== opsSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { firm_id?: string; email?: string; full_name?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const firmId = body.firm_id?.trim();
  const email = body.email?.trim();
  if (!firmId || !email) {
    return NextResponse.json(
      { error: "firm_id and email are required" },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();
    const result = await inviteFirmUser(admin, {
      firmId,
      email,
      fullName: body.full_name,
    });

    return NextResponse.json({
      ok: true,
      firm_user_id: result.firmUserId,
      invited: result.invited,
    });
  } catch (e) {
    if (e instanceof SupabaseAdminKeyMissingError) {
      return NextResponse.json(
        { error: "Database admin is not configured" },
        { status: 503 },
      );
    }
    if (e instanceof Error && e.message === "email_required") {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    console.error("POST /api/firms/invite", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
