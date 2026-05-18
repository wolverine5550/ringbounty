import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ANONYMOUS_SESSION_COOKIE_NAME,
  isValidAnonymousSessionId,
} from "@/lib/anonymous-session";
import { createClient } from "@/lib/supabase/server";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";

import {
  buildAccountRequiredHref,
  buildLoginHrefForClaim,
  sanitizePostCheckReturnPath,
} from "./gated-routes";
import { loadAnonymousDraftGateStatus, loadClaimGateStatusByClaimId } from "./load-claim-query-snapshot";

export type EnforcePostCheckAccessOptions = {
  /** Current path (e.g. `/results`) used for returnTo / next deep links. */
  returnPath: string;
  /** Optional `claim` query param when the URL already carries the id. */
  claimIdFromQuery?: string | null;
};

/**
 * Server layout guard for §2.5.2:
 * - Authenticated users pass through.
 * - Anonymous + completed free check (claim has subjects) → account wall.
 * - Anonymous + no check yet → login when hitting gated routes without a claim.
 */
export async function enforcePostCheckAccess(
  options: EnforcePostCheckAccessOptions,
): Promise<void> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (claimsData?.claims) {
    return;
  }

  const returnPath = sanitizePostCheckReturnPath(options.returnPath);
  const cookieStore = await cookies();
  const anonymousRaw = cookieStore.get(ANONYMOUS_SESSION_COOKIE_NAME)?.value;

  let claimId = options.claimIdFromQuery ?? null;

  try {
    const admin = createAdminClient();

    if (!claimId && isValidAnonymousSessionId(anonymousRaw)) {
      const gate = await loadAnonymousDraftGateStatus(admin, anonymousRaw);
      claimId = gate?.claimId ?? null;

      if (gate?.requiresAccountWall) {
        redirect(
          buildAccountRequiredHref({ claimId: gate.claimId, returnTo: returnPath }),
        );
      }
    }

    if (claimId) {
      const gate = await loadClaimGateStatusByClaimId(admin, claimId);
      if (gate?.requiresAccountWall) {
        redirect(
          buildAccountRequiredHref({ claimId: gate.claimId, returnTo: returnPath }),
        );
      }
    }
  } catch (e) {
    if (!(e instanceof SupabaseAdminKeyMissingError)) {
      throw e;
    }
  }

  if (claimId) {
    redirect(buildLoginHrefForClaim({ returnPath, claimId }));
  }

  redirect(`/login?next=${encodeURIComponent(returnPath)}`);
}
