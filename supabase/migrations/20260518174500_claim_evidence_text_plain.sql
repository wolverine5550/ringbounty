-- Q14 additional evidence — allow plain-text notes in `claim-evidence` bucket.

update storage.buckets
set
  allowed_mime_types = array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain'
  ]
where id = 'claim-evidence';
