-- Allow admins to upload/manage photos in 'animal-photos' bucket

-- 1. Enable RLS on objects if not already (standard practice)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies if necessary (or just add new ones)
-- We'll try to create a broad policy for staff (caregivers + admins)

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

-- Policy for SELECT (View) - Public access is usually needed for images
CREATE POLICY "Anyone can view animal photos" ON storage.objects
FOR SELECT USING (bucket_id = 'animal-photos');
