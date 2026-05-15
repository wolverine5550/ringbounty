/**
 * Whether the user may leave Step 0 for number entry (task_manager §4.2.3):
 * all checklist items checked, **or** explicit “continue anyway” acknowledgement.
 */

export function canContinueToNumberEntry(
  checkedCount: number,
  totalItems: number,
  continueAnywayAcknowledged: boolean,
): boolean {
  if (continueAnywayAcknowledged) {
    return true;
  }
  return totalItems > 0 && checkedCount === totalItems;
}
