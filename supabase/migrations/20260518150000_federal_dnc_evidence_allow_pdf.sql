-- §6.2.4 — Allow PDF uploads for optional federal DNC FTC confirmation evidence.

update storage.buckets
set
  allowed_mime_types = array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf'
  ]
where id = 'claim-evidence';
