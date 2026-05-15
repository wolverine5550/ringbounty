-- Phase 2.7–2.8: in-DB rate limiting buckets + newsletter waitlist (server-only writes).
-- Applied via Supabase MCP; explicit GRANTs for Data API rollout (May 30 / Oct 30, 2026).

-- Sliding-window counters keyed by scope (ip | anonymous_session) + action.
create table public.rate_limit_buckets (
  scope text not null,
  bucket_key text not null,
  action text not null,
  window_start timestamptz not null,
  hit_count integer not null default 0,
  constraint rate_limit_buckets_hit_count_nonneg check (hit_count >= 0),
  primary key (scope, bucket_key, action, window_start)
);

comment on table public.rate_limit_buckets is
  'Hourly (configurable) rate-limit counters; service_role only. Used for anonymous check submissions and abuse control.';

create index rate_limit_buckets_window_start_idx
  on public.rate_limit_buckets (window_start);

alter table public.rate_limit_buckets enable row level security;

-- Atomic increment + allow/deny for a fixed window (default 3600s).
create or replace function public.consume_rate_limit(
  p_scope text,
  p_bucket_key text,
  p_action text,
  p_max_count integer,
  p_window_secs integer default 3600
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_count integer;
  v_allowed boolean;
  v_retry_after integer;
begin
  if p_max_count < 1 or p_window_secs < 1 then
    raise exception 'invalid rate limit parameters';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_secs) * p_window_secs
  );

  insert into public.rate_limit_buckets (
    scope,
    bucket_key,
    action,
    window_start,
    hit_count
  )
  values (p_scope, p_bucket_key, p_action, v_window_start, 1)
  on conflict (scope, bucket_key, action, window_start)
  do update set hit_count = rate_limit_buckets.hit_count + 1
  returning hit_count into v_count;

  v_allowed := v_count <= p_max_count;
  v_retry_after := p_window_secs - (
    extract(epoch from now())::integer % p_window_secs
  );

  return jsonb_build_object(
    'allowed', v_allowed,
    'current_count', v_count,
    'retry_after_seconds', v_retry_after,
    'window_start', v_window_start
  );
end;
$$;

comment on function public.consume_rate_limit is
  'Increments a rate-limit bucket and returns allowed flag + metadata. Callable only via service_role from app.';

-- Email capture for ineligible / blocked flows (§2.8).
create table public.newsletter_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_hash text not null,
  source text not null,
  marketing_consent boolean not null default false,
  anonymous_session_id text,
  claim_id uuid references public.claims (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint newsletter_waitlist_email_hash_unique unique (email_hash),
  constraint newsletter_waitlist_source_check check (
    source in (
      'ineligible_check',
      'exempt_only',
      'notify_me_cta',
      'blocked_flow'
    )
  )
);

comment on table public.newsletter_waitlist is
  'Marketing / notify-me signups from ineligible or blocked check flows. Inserts via service_role API only.';

create index newsletter_waitlist_created_at_idx
  on public.newsletter_waitlist (created_at desc);

create index newsletter_waitlist_claim_id_idx
  on public.newsletter_waitlist (claim_id)
  where claim_id is not null;

alter table public.newsletter_waitlist enable row level security;

grant select, insert, update, delete on table public.rate_limit_buckets to service_role;
grant execute on function public.consume_rate_limit(text, text, text, integer, integer) to service_role;

grant select, insert on table public.newsletter_waitlist to service_role;
