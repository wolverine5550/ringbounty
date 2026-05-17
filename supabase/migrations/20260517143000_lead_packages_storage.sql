-- Phase 13.2.2 — Private bucket for firm-facing evidence PDFs (service_role uploads in v0.1).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lead-packages',
  'lead-packages',
  false,
  10485760,
  array['application/pdf']::text[]
)
on conflict (id) do nothing;
