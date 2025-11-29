-- Allow admins to upload/manage photos in 'animal-photos' bucket
-- Simplified version: We assume RLS is already enabled on storage.objects (default in Supabase)
-- We only drop and recreate the policies.

-- Drop existing restrictive policies if necessary
DROP POLICY IF EXISTS "Staff can upload animal photos" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update animal photos" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete animal photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view animal photos" ON storage.objects;

-- Policy for INSERT (Upload)
CREATE POLICY "Staff can upload animal photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'animal-photos' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('caregiver', 'admin')
  )
);

-- Policy for UPDATE
CREATE POLICY "Staff can update animal photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'animal-photos' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('caregiver', 'admin')
  )
);

-- Policy for DELETE
CREATE POLICY "Staff can delete animal photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'animal-photos' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('caregiver', 'admin')
  )
);

-- Policy for SELECT (View) - Public access
CREATE POLICY "Anyone can view animal photos" ON storage.objects
FOR SELECT USING (bucket_id = 'animal-photos');
