-- Consumer receiving line for federal DNC (distinct from spammer numbers on claim_subjects).

alter table public.users
  add column if not exists receiving_phone text,
  add column if not exists receiving_phone_normalized text;

comment on column public.users.receiving_phone is
  'Masked display for the consumer line that received unwanted calls (e.g. (815) 545-7907).';

comment on column public.users.receiving_phone_normalized is
  'E.164 for receiving_phone; used for federal DNC reuse across claims on this account.';

create index if not exists users_receiving_phone_normalized_idx
  on public.users (receiving_phone_normalized)
  where receiving_phone_normalized is not null;
