-- FIX INFINITE RECURSION IN RLS
-- We use a SECURITY DEFINER function to check roles. 
-- This function runs with elevated privileges, bypassing RLS to read the role, thus avoiding the recursion loop.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 1. PROFILES
-- Reset policies to use the new function
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT
USING (get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE
USING (get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE
USING (get_my_role() = 'admin');

-- Ensure users can see their own profile (essential for basic app function)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
USING (auth.uid() = id);


-- 2. ANIMALS
-- Update to use the safe function
DROP POLICY IF EXISTS "Staff can view all animals" ON animals;
CREATE POLICY "Staff can view all animals" ON animals
  FOR SELECT USING (get_my_role() IN ('caregiver', 'admin'));

DROP POLICY IF EXISTS "Staff can insert animals" ON animals;
CREATE POLICY "Staff can insert animals" ON animals
  FOR INSERT WITH CHECK (get_my_role() IN ('caregiver', 'admin'));

DROP POLICY IF EXISTS "Staff can update animals" ON animals;
CREATE POLICY "Staff can update animals" ON animals
  FOR UPDATE USING (get_my_role() IN ('caregiver', 'admin'));

DROP POLICY IF EXISTS "Staff can delete animals" ON animals;
CREATE POLICY "Staff can delete animals" ON animals
  FOR DELETE USING (get_my_role() IN ('caregiver', 'admin'));


-- 3. DAILY REPORTS
DROP POLICY IF EXISTS "Staff can view all reports" ON daily_reports;
CREATE POLICY "Staff can view all reports" ON daily_reports
  FOR SELECT USING (get_my_role() IN ('caregiver', 'admin'));

DROP POLICY IF EXISTS "Staff can insert reports" ON daily_reports;
CREATE POLICY "Staff can insert reports" ON daily_reports
  FOR INSERT WITH CHECK (get_my_role() IN ('caregiver', 'admin'));


-- 4. STORAGE (Photos)
DROP POLICY IF EXISTS "Staff can upload animal photos" ON storage.objects;
CREATE POLICY "Staff can upload animal photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'animal-photos' AND
  auth.role() = 'authenticated' AND
  get_my_role() IN ('caregiver', 'admin')
);

DROP POLICY IF EXISTS "Staff can update animal photos" ON storage.objects;
CREATE POLICY "Staff can update animal photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'animal-photos' AND
  auth.role() = 'authenticated' AND
  get_my_role() IN ('caregiver', 'admin')
);

DROP POLICY IF EXISTS "Staff can delete animal photos" ON storage.objects;
CREATE POLICY "Staff can delete animal photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'animal-photos' AND
  auth.role() = 'authenticated' AND
  get_my_role() IN ('caregiver', 'admin')
);
