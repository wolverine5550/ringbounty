-- Baseline migration (§1.2.2): enable pgcrypto for digest(), gen_random_bytes(), and related helpers.
-- Hosted Postgres also exposes gen_random_uuid() without this extension; this file follows the
-- "enable pgcrypto" path from the task list. Safe to re-run (IF NOT EXISTS).

create extension if not exists pgcrypto with schema extensions;
