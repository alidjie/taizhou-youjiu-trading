
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('crm-branding','crm-branding',true,5242880,ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO UPDATE
SET public=true,
    file_size_limit=5242880,
    allowed_mime_types=ARRAY['image/png','image/jpeg','image/webp'];

DROP POLICY IF EXISTS crm_branding_public_read ON storage.objects;
CREATE POLICY crm_branding_public_read ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id='crm-branding');

DROP POLICY IF EXISTS crm_branding_admin_insert ON storage.objects;
CREATE POLICY crm_branding_admin_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id='crm-branding'
  AND (select private.crm_current_role())='admin'
);

DROP POLICY IF EXISTS crm_branding_admin_update ON storage.objects;
CREATE POLICY crm_branding_admin_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id='crm-branding'
  AND (select private.crm_current_role())='admin'
)
WITH CHECK (
  bucket_id='crm-branding'
  AND (select private.crm_current_role())='admin'
);

DROP POLICY IF EXISTS crm_branding_admin_delete ON storage.objects;
CREATE POLICY crm_branding_admin_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id='crm-branding'
  AND (select private.crm_current_role())='admin'
);

DROP POLICY IF EXISTS crm_branding_factory_insert ON storage.objects;
CREATE POLICY crm_branding_factory_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id='crm-branding'
  AND (select private.crm_current_role())='factory'
  AND split_part(name,'/',1)='factory'
  AND split_part(name,'/',2)=(select private.crm_current_factory_id())::text
);

DROP POLICY IF EXISTS crm_branding_factory_update ON storage.objects;
CREATE POLICY crm_branding_factory_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id='crm-branding'
  AND (select private.crm_current_role())='factory'
  AND split_part(name,'/',1)='factory'
  AND split_part(name,'/',2)=(select private.crm_current_factory_id())::text
)
WITH CHECK (
  bucket_id='crm-branding'
  AND (select private.crm_current_role())='factory'
  AND split_part(name,'/',1)='factory'
  AND split_part(name,'/',2)=(select private.crm_current_factory_id())::text
);

DROP POLICY IF EXISTS crm_branding_factory_delete ON storage.objects;
CREATE POLICY crm_branding_factory_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id='crm-branding'
  AND (select private.crm_current_role())='factory'
  AND split_part(name,'/',1)='factory'
  AND split_part(name,'/',2)=(select private.crm_current_factory_id())::text
);
