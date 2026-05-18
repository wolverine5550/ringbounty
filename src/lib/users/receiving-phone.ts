/**
 * Consumer receiving line on `public.users` (federal DNC — not spammer numbers).
 */

import {
  formatUsPhoneMask,
  normalizeUsPhoneToE164,
} from "@/lib/check/us-phone";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type UserReceivingPhone = {
  display: string;
  normalized: string;
};

export type ParseReceivingPhoneResult =
  | { ok: true; value: UserReceivingPhone }
  | { ok: false; error: string };

/**
 * Validates a US receiving-line input for profile persistence.
 */
export function parseReceivingPhoneInput(raw: string): ParseReceivingPhoneResult {
  const normalized = normalizeUsPhoneToE164(raw);
  if (!normalized) {
    return {
      ok: false,
      error:
        "Enter a valid U.S. phone number for the line that received these calls.",
    };
  }
  const ten = normalized.slice(2);
  return {
    ok: true,
    value: {
      normalized,
      display: formatUsPhoneMask(ten),
    },
  };
}

/**
 * Loads saved receiving phone for the signed-in user profile.
 */
export async function loadUserReceivingPhone(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserReceivingPhone | null> {
  const { data, error } = await supabase
    .from("users")
    .select("receiving_phone, receiving_phone_normalized")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (
    !data?.receiving_phone_normalized?.trim() ||
    !data.receiving_phone?.trim()
  ) {
    return null;
  }

  return {
    display: data.receiving_phone.trim(),
    normalized: data.receiving_phone_normalized.trim(),
  };
}

/**
 * Upserts receiving phone on `public.users` (RLS: own row only).
 */
export async function persistUserReceivingPhone(
  supabase: SupabaseClient<Database>,
  params: { userId: string; phone: UserReceivingPhone },
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({
      receiving_phone: params.phone.display,
      receiving_phone_normalized: params.phone.normalized,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.userId);

  if (error) {
    throw error;
  }
}
