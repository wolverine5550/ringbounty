/**
 * Phase 6.3.2 / 13.7 — State DNC status for API responses.
 */

import {
  STATE_DNC_CHECK_GENERIC_MESSAGE,
  stateDncComingSoonMessage,
} from "@/lib/constants/state-dnc-unavailable";
import {
  getApplicableStateDncCode,
  deriveStateDncScaffoldFields,
} from "@/lib/dnc/scaffold-state-dnc-row";
import { isStateDncAutomatedCheckEnabled } from "@/lib/dnc/state-dnc-flags";
import type { StateDncFlagsEnv } from "@/lib/dnc/state-dnc-flags";

export type StateDncCheckStatus =
  | "not_applicable"
  | "coming_soon"
  | "flag_enabled_pending_provider"
  | "unknown";

export type StateDncCheckSummary = {
  status: StateDncCheckStatus;
  state_code: string | null;
  automated_check_available: boolean;
  user_message: string;
};

/**
 * JSON fragment for clients when user state is known (e.g. qualify / authenticated).
 */
export function getStateDncCheckSummaryForUserState(
  userStateRaw: string | null | undefined,
  env: StateDncFlagsEnv = process.env,
): StateDncCheckSummary {
  const fields = deriveStateDncScaffoldFields(userStateRaw);
  const applicableCode = getApplicableStateDncCode(fields);

  if (applicableCode) {
    const flagEnabled = isStateDncAutomatedCheckEnabled(applicableCode, env);
    return {
      status: flagEnabled ? "flag_enabled_pending_provider" : "coming_soon",
      state_code: applicableCode,
      automated_check_available: flagEnabled,
      user_message: stateDncComingSoonMessage(applicableCode),
    };
  }

  if (fields.state_dnc_applicable === false && fields.state_dnc_state) {
    return {
      status: "not_applicable",
      state_code: fields.state_dnc_state,
      automated_check_available: false,
      user_message: "",
    };
  }

  return {
    status: "unknown",
    state_code: null,
    automated_check_available: false,
    user_message: STATE_DNC_CHECK_GENERIC_MESSAGE,
  };
}

/** Anonymous `/check` — state not known yet. */
export function getStateDncCheckSummaryForAnonymousCheck(): StateDncCheckSummary {
  return {
    status: "unknown",
    state_code: null,
    automated_check_available: false,
    user_message: STATE_DNC_CHECK_GENERIC_MESSAGE,
  };
}
