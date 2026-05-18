/**
 * Evidence preservation gate (task_manager §4.2.3): all items checked **or** explicit continue-anyway.
 * Used on `/attorney-connect` before sharing with attorneys.
 */

export function canProceedPastEvidenceChecklist(
  checkedCount: number,
  totalItems: number,
  continueAnywayAcknowledged: boolean,
): boolean {
  if (continueAnywayAcknowledged) {
    return true;
  }
  return totalItems > 0 && checkedCount === totalItems;
}

/** @deprecated Use {@link canProceedPastEvidenceChecklist}. */
export const canContinueToNumberEntry = canProceedPastEvidenceChecklist;
