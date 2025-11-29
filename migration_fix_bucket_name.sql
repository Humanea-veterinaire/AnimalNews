-- FIX BUCKET NAME IN RLS
-- The frontend uses 'report-images', but previous policies used 'animal-photos'.
-- We need to apply the policies to the correct bucket.

-- 1. Drop policies for the wrong bucket name (optional, but good for cleanup)
DROP POLICY IF EXISTS "Staff can upload animal photos" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update animal photos" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete animal photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view animal photos" ON storage.objects;

-- 2. Create policies for 'report-images'
CREATE POLICY "Staff can upload report images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'report-images' AND
  auth.role() = 'authenticated' AND
  public.get_my_role() IN ('caregiver', 'admin')
);

CREATE POLICY "Staff can update report images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'report-images' AND
  auth.role() = 'authenticated' AND
  public.get_my_role() IN ('caregiver', 'admin')
);

CREATE POLICY "Staff can delete report images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'report-images' AND
  auth.role() = 'authenticated' AND
  public.get_my_role() IN ('caregiver', 'admin')
);

CREATE POLICY "Anyone can view report images" ON storage.objects
FOR SELECT USING (bucket_id = 'report-images');
