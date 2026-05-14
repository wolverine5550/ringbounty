-- Phase 1.9 `letters` (prd.md section 5 + task_manager 1.9.2–1.9.4).
-- RLS: consumer owns rows where user_id = auth.uid() (task_manager 1.11.5; mirrors prd.md RLS sketch).
-- Storage object layout for generated PDFs is documented in README.md (letters/{user_id}/{letter_id}.pdf).

create table public.letters (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  claim_subject_id uuid references public.claim_subjects (id) on delete set null,
  violation_type text references public.violation_types (id),
  stripe_payment_intent_id text,
  amount_paid_cents integer not null default 2900,
  demand_scenario text,
  letter_prompt text,
  letter_content text,
  pdf_url text,
  generated_at timestamptz,
  downloaded_at timestamptz,
  created_at timestamptz not null default now(),
  constraint letters_demand_scenario_check check (
    demand_scenario is null
    or demand_scenario in ('conservative', 'realistic', 'maximum')
  )
);

comment on table public.letters is
  'Purchased demand letter artifacts; claim_subject_id groups the company context when known.';

comment on column public.letters.demand_scenario is
  'User-selected tone band for generation: conservative | realistic | maximum.';

alter table public.letters enable row level security;

create policy letters_select_own
  on public.letters
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  );

create policy letters_insert_own
  on public.letters
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  );

create policy letters_update_own
  on public.letters
  for update
  to authenticated
  using (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  )
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  );

create policy letters_delete_own
  on public.letters
  for delete
  to authenticated
  using (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  );

create index letters_claim_id_idx on public.letters (claim_id);
create index letters_user_id_idx on public.letters (user_id);
create index letters_claim_subject_id_idx on public.letters (claim_subject_id)
  where claim_subject_id is not null;

create unique index letters_stripe_payment_intent_id_unique
  on public.letters (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

grant select, insert, update, delete on table public.letters to authenticated;
grant select, insert, update, delete on table public.letters to service_role;
