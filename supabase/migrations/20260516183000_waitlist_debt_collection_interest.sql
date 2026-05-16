-- Phase 5.7.2 — optional email capture for debt-collection vertical interest (no new product promise).

alter table public.newsletter_waitlist
  drop constraint newsletter_waitlist_source_check;

alter table public.newsletter_waitlist
  add constraint newsletter_waitlist_source_check check (
    source in (
      'ineligible_check',
      'exempt_only',
      'notify_me_cta',
      'blocked_flow',
      'debt_collection_interest'
    )
  );
