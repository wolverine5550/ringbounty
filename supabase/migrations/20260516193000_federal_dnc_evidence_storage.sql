-- Phase 6.2.4 — Private bucket for optional federal DNC FTC confirmation screenshots.
-- Path convention: {auth.uid()}/{claim_id}/{claim_subject_id}/federal-dnc-confirmation.{ext}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'claim-evidence',
  'claim-evidence',
  false,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy claim_evidence_insert_own_folder
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'claim-evidence'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy claim_evidence_select_own_folder
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'claim-evidence'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy claim_evidence_update_own_folder
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'claim-evidence'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'claim-evidence'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
