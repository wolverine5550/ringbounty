/**
 * Anonymous `/check` funnel: a row may stay `draft` until the first substantive phone
 * persist, then moves to `checking` (task_manager §4.5.2). Queries that resolve “the
 * session’s active anonymous claim” must match both.
 */
export const ANONYMOUS_FUNNEL_ACTIVE_STATUSES = ["draft", "checking"] as const;

export type AnonymousFunnelActiveStatus =
  (typeof ANONYMOUS_FUNNEL_ACTIVE_STATUSES)[number];
