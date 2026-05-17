-- Phase 13.3.3 — Stripe Connect account id + payout readiness on law_firms.

alter table public.law_firms
  add column if not exists stripe_connect_account_id text,
  add column if not exists stripe_connect_charges_enabled boolean not null default false,
  add column if not exists stripe_connect_details_submitted boolean not null default false;

comment on column public.law_firms.stripe_connect_account_id is
  'Stripe Connect account id (Express, acct_…). Set during firm onboarding (§13.3).';

comment on column public.law_firms.stripe_connect_charges_enabled is
  'Mirrors Stripe Account.charges_enabled; updated via account.updated webhook (§13.3.3).';

comment on column public.law_firms.stripe_connect_details_submitted is
  'Mirrors Stripe Account.details_submitted; updated via account.updated webhook (§13.3.3).';

create unique index if not exists law_firms_stripe_connect_account_id_unique
  on public.law_firms (stripe_connect_account_id)
  where stripe_connect_account_id is not null;

create index if not exists law_firms_stripe_connect_account_id_idx
  on public.law_firms (stripe_connect_account_id)
  where stripe_connect_account_id is not null;
