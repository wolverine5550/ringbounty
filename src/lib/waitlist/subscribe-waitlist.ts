import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { hashEmail, normalizeEmail } from "./hash-email";
import type { WaitlistSource } from "./constants";

const POSTGRES_UNIQUE_VIOLATION = "23505";

export type SubscribeWaitlistInput = {
  email: string;
  source: WaitlistSource;
  marketingConsent: boolean;
  anonymousSessionId?: string | null;
  claimId?: string | null;
};

export type SubscribeWaitlistResult =
  | { status: "created" }
  | { status: "already_subscribed" };

/**
 * Persists a waitlist row via admin client (§2.8.2). Dedupes on `email_hash`.
 */
export async function subscribeWaitlist(
  admin: SupabaseClient<Database>,
  input: SubscribeWaitlistInput,
): Promise<SubscribeWaitlistResult> {
  const normalized = normalizeEmail(input.email);
  const emailHash = hashEmail(normalized);

  const { error } = await admin.from("newsletter_waitlist").insert({
    email: normalized,
    email_hash: emailHash,
    source: input.source,
    marketing_consent: input.marketingConsent,
    anonymous_session_id: input.anonymousSessionId ?? null,
    claim_id: input.claimId ?? null,
  });

  if (!error) {
    return { status: "created" };
  }

  if (error.code === POSTGRES_UNIQUE_VIOLATION) {
    return { status: "already_subscribed" };
  }

  throw error;
}
