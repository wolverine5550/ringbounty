/**
 * Phase 6.3.2 — State DNC status for API responses (no automated lookup in v0.1).
 */

import {
  STATE_DNC_CHECK_GENERIC_MESSAGE,
  stateDncComingSoonMessage,
} from "@/lib/constants/state-dnc-unavailable";
import {
  getApplicableStateDncCode,
  deriveStateDncScaffoldFields,
} from "@/lib/dnc/scaffold-state-dnc-row";

export type StateDncCheckStatus = "not_applicable" | "coming_soon" | "unknown";

export type StateDncCheckSummary = {
  status: StateDncCheckStatus;
  state_code: string | null;
  automated_check_available: false;
  user_message: string;
};

/**
 * JSON fragment for clients when user state is known (e.g. qualify / authenticated).
 */
export function getStateDncCheckSummaryForUserState(
  userStateRaw: string | null | undefined,
): StateDncCheckSummary {
  const fields = deriveStateDncScaffoldFields(userStateRaw);
  const applicableCode = getApplicableStateDncCode(fields);

  if (applicableCode) {
    return {
      status: "coming_soon",
      state_code: applicableCode,
      automated_check_available: false,
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
