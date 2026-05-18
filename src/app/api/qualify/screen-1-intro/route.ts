import { NextResponse } from "next/server";

import { persistQualifyIntroAck } from "@/lib/qualify/screen-1-intro";
import { createClient } from "@/lib/supabase/server";

/**
 * Phase 7.2 — Acknowledge step 1 intro (no consent answers).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const claimId =
    typeof record.claim_id === "string" ? record.claim_id.trim() : "";
  if (!claimId) {
    return NextResponse.json({ error: "claim_id is required" }, { status: 400 });
  }

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("id")
    .eq("id", claimId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (claimError) {
    console.error("POST /api/qualify/screen-1-intro claim load", claimError);
    return NextResponse.json({ error: "Could not load claim" }, { status: 500 });
  }
  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }

  try {
    await persistQualifyIntroAck(supabase, { claimId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/qualify/screen-1-intro persist", e);
    return NextResponse.json({ error: "Could not save progress" }, { status: 500 });
  }
}
