import { type NextRequest, NextResponse } from "next/server";

import { loadQualifyCompanyIntelSnapshot } from "@/lib/qualify/load-qualify-company-intel";
import { createClient } from "@/lib/supabase/server";

/**
 * CI-8.1 — Poll Lane B suggest fields for Qualify Screen 4 (no raw scrape payloads).
 *
 * `GET /api/qualify/company-intel?claimSubjectId=<uuid>`
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const claimSubjectId =
    request.nextUrl.searchParams.get("claimSubjectId")?.trim() ?? "";

  if (!claimSubjectId) {
    return NextResponse.json(
      { error: "claimSubjectId is required" },
      { status: 400 },
    );
  }

  try {
    const snapshot = await loadQualifyCompanyIntelSnapshot(supabase, {
      claimSubjectId,
      userId: user.id,
    });

    if (!snapshot) {
      return NextResponse.json({ error: "Claim subject not found" }, { status: 404 });
    }

    return NextResponse.json(snapshot);
  } catch (e) {
    console.error("GET /api/qualify/company-intel", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
