-- 0010_create_id_documents_bucket.sql
-- Create private storage bucket for ID documents and configure storage RLS

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'id-documents',
  'id-documents',
  false,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

-- Storage RLS on storage.objects for id-documents
DROP POLICY IF EXISTS "Users upload own id docs" ON storage.objects;
CREATE POLICY "Users upload own id docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'id-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users read own id docs or admin read all" ON storage.objects;
CREATE POLICY "Users read own id docs or admin read all"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'id-documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    public.is_admin()
  )
);

DROP POLICY IF EXISTS "Users update own id docs" ON storage.objects;
CREATE POLICY "Users update own id docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'id-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users delete own id docs before approval" ON storage.objects;
CREATE POLICY "Users delete own id docs before approval"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'id-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  NOT public.is_verified_driver(auth.uid())
);
