/**
 * Phase 5.1 — Feature flags for spam providers (server-side env).
 * Reads boolean-ish strings from `process.env`; adapters in §5.2–§5.4 consult these before HTTP calls.
 *
 * The first spam / reputation integration uses **Twilio’s REST API** (see §5.2).
 */

/** Env keys wired in `.env.example` / hosting dashboards (boolean strings, e.g. `true` / `false`). */
export const SPAM_PROVIDER_TWILIO_ENV_KEY =
  "SPAM_PROVIDER_TWILIO_ENABLED" as const;
export const SPAM_PROVIDER_YOUMAIL_ENV_KEY =
  "SPAM_PROVIDER_YOUMAIL_ENABLED" as const;

export type SpamProviderFeatureFlags = {
  twilioEnabled: boolean;
  youmailEnabled: boolean;
};

/**
 * Parses common boolean string forms used in env vars.
 * Only a small allowlist counts as “on” so accidental typos default to off.
 */
export function parseBooleanEnv(value: string | undefined): boolean {
  if (value === undefined || value.trim() === "") {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "true" || normalized === "1" || normalized === "yes"
  );
}

/** Partial env bag (`process.env` shape) so tests can omit unrelated keys like `NODE_ENV`. */
export type SpamProviderEnv = Record<string, string | undefined>;

/**
 * Returns whether each Phase 5 spam provider is enabled via env.
 * Pass `env` in tests; omit to use `process.env` on the server.
 */
export function getSpamProviderFeatureFlags(
  env: SpamProviderEnv = process.env,
): SpamProviderFeatureFlags {
  return {
    twilioEnabled: parseBooleanEnv(env[SPAM_PROVIDER_TWILIO_ENV_KEY]),
    youmailEnabled: parseBooleanEnv(env[SPAM_PROVIDER_YOUMAIL_ENV_KEY]),
  };
}
