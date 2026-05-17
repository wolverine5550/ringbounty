/** Rate-limit action keys stored in `public.rate_limit_buckets.action`. */
export const RATE_LIMIT_ACTION_CHECK_SUBMISSION = "check_submission" as const;

export const RATE_LIMIT_ACTION_WAITLIST = "waitlist_signup" as const;

/** Phase 6.5.5 — registered-agent / OpenCorporates lookups per anonymous session. */
export const RATE_LIMIT_ACTION_OPENCORPORATES_LOOKUP =
  "opencorporates_lookup" as const;

/** Scopes for `public.rate_limit_buckets.scope`. */
export const RATE_LIMIT_SCOPE_IP = "ip" as const;
export const RATE_LIMIT_SCOPE_ANONYMOUS_SESSION = "anonymous_session" as const;

/** Tunable defaults (§2.7.2) — adjust after abuse review. */
export const CHECK_SUBMISSION_LIMIT_PER_SESSION = 10;
export const CHECK_SUBMISSION_LIMIT_PER_IP = 30;
export const CHECK_SUBMISSION_WINDOW_SECONDS = 3600;

export const WAITLIST_LIMIT_PER_IP = 5;
export const WAITLIST_WINDOW_SECONDS = 3600;

/** Tunable — one lookup may perform several HTTP calls internally. */
export const OPENCORPORATES_LOOKUP_LIMIT_PER_SESSION = 6;
export const OPENCORPORATES_LOOKUP_WINDOW_SECONDS = 3600;

/** User-facing copy when limited (§2.7.3). */
export const RATE_LIMIT_USER_MESSAGE =
  "You have reached the hourly limit for checks. Please try again later.";

export const WAITLIST_RATE_LIMIT_USER_MESSAGE =
  "Too many sign-up attempts. Please try again later.";
