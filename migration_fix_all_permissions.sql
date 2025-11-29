-- CONSOLIDATED PERMISSIONS FIX
-- Run this to ensure all permissions are correctly set for Admins and Caregivers

-- 1. PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 2. ANIMALS
DROP POLICY IF EXISTS "Staff can view all animals" ON animals;
DROP POLICY IF EXISTS "Staff can insert animals" ON animals;
DROP POLICY IF EXISTS "Staff can update animals" ON animals;
DROP POLICY IF EXISTS "Staff can delete animals" ON animals;
-- (Drop old ones too just in case)
DROP POLICY IF EXISTS "Caregivers can view all animals" ON animals;
DROP POLICY IF EXISTS "Caregivers can insert animals" ON animals;
DROP POLICY IF EXISTS "Caregivers can update animals" ON animals;

CREATE POLICY "Staff can view all animals" ON animals
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('caregiver', 'admin')));

CREATE POLICY "Staff can insert animals" ON animals
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('caregiver', 'admin')));

CREATE POLICY "Staff can update animals" ON animals
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('caregiver', 'admin')));

CREATE POLICY "Staff can delete animals" ON animals
  FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('caregiver', 'admin')));

-- 3. DAILY REPORTS
DROP POLICY IF EXISTS "Staff can view all reports" ON daily_reports;
DROP POLICY IF EXISTS "Staff can insert reports" ON daily_reports;
-- (Drop old ones)
DROP POLICY IF EXISTS "Caregivers can view all reports" ON daily_reports;
DROP POLICY IF EXISTS "Caregivers can insert reports" ON daily_reports;

CREATE POLICY "Staff can view all reports" ON daily_reports
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('caregiver', 'admin')));

CREATE POLICY "Staff can insert reports" ON daily_reports
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('caregiver', 'admin')));

-- 4. STORAGE (Photos)
-- We don't touch the table structure, just policies
DROP POLICY IF EXISTS "Staff can upload animal photos" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update animal photos" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete animal photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view animal photos" ON storage.objects;

CREATE POLICY "Staff can upload animal photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'animal-photos' AND
  auth.role() = 'authenticated' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('caregiver', 'admin'))
);

CREATE POLICY "Staff can update animal photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'animal-photos' AND
  auth.role() = 'authenticated' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('caregiver', 'admin'))
);

CREATE POLICY "Staff can delete animal photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'animal-photos' AND
  auth.role() = 'authenticated' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('caregiver', 'admin'))
);

CREATE POLICY "Anyone can view animal photos" ON storage.objects
FOR SELECT USING (bucket_id = 'animal-photos');
