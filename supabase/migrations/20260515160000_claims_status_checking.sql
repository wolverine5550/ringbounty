-- §4.5.2 — allow intermediate `checking` after phone submit (`/check`), before Phase 5+ outcomes.

alter table public.claims drop constraint claims_status_check;

alter table public.claims add constraint claims_status_check check (
  status in (
    'draft',
    'checking',
    'qualified',
    'letter_purchased',
    'letter_generated',
    'referred',
    'attorney_contacted',
    'retained',
    'closed'
  )
);

comment on constraint claims_status_check on public.claims is
  'Lifecycle includes `checking`: numbers persisted on draft claim, provider pipeline pending.';
