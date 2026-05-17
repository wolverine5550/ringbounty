/**
 * Phase 8.3.1 — PRD §11 violation counts from qualification answers.
 */

import type { QualifyScreen2Answers } from "@/lib/qualify/screen-2-stop-request";
import type { QualifyScreen3Answers } from "@/lib/qualify/screen-3-call-details";

/** Inputs for PRD §11 `standard_*` / `willful_*` / `time_*` counts. */
export type ViolationCountInput = {
  /** Q8 bucket lower bound (`call_count_total`). */
  callCountTotal: number;
  /** Q9 — calls after stop (only when stop request + post-stop calls). */
  callCountAfterStop: number | null;
  /** Screen 2 Q7 — calls after stop request (willful path). */
  stopRequestIgnored: boolean;
  callsBefore8am: boolean;
  callsAfter9pm: boolean;
  /** Q12 count when after-9pm is Yes. */
  callsAfter9pmCount: number | null;
};

export type ViolationCounts = {
  standardViolationCount: number;
  willfulViolationCount: number;
  timeViolationCount: number;
};

/**
 * PRD §11:
 *   standard = call_count_total - call_count_after_stop
 *   willful = call_count_after_stop (when stop_request_ignored)
 *   time = calls_outside_hours
 */
export function computeViolationCounts(
  input: ViolationCountInput,
): ViolationCounts {
  const willfulViolationCount =
    input.stopRequestIgnored &&
    input.callCountAfterStop !== null &&
    input.callCountAfterStop > 0
      ? input.callCountAfterStop
      : 0;

  const totalCalls = Math.max(input.callCountTotal, willfulViolationCount);
  const standardViolationCount = Math.max(
    0,
    totalCalls - willfulViolationCount,
  );

  let timeViolationCount = 0;
  if (input.callsBefore8am) {
    timeViolationCount += 1;
  }
  if (input.callsAfter9pm) {
    timeViolationCount += input.callsAfter9pmCount ?? 1;
  }

  return {
    standardViolationCount,
    willfulViolationCount,
    timeViolationCount,
  };
}

/** Builds {@link ViolationCountInput} from persisted Screen 2–3 answers. */
export function buildViolationCountInput(
  screen2: QualifyScreen2Answers | null,
  screen3: QualifyScreen3Answers | null,
): ViolationCountInput | null {
  if (!screen3) {
    return null;
  }

  const stopRequestIgnored =
    screen2?.stopRequestMade === true &&
    screen2.callsAfterStopRequest === true;

  return {
    callCountTotal: screen3.callCountTotal,
    callCountAfterStop: stopRequestIgnored ? screen3.callCountAfterStop : null,
    stopRequestIgnored,
    callsBefore8am: screen3.callsBefore8am,
    callsAfter9pm: screen3.callsAfter9pm,
    callsAfter9pmCount: screen3.callsAfter9pmCount,
  };
}
