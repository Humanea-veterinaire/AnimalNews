-- FINAL RLS FIX
-- We explicitly qualify the function with 'public.' to ensure it's found in all contexts (including Storage).
-- We also ensure the function has the correct permissions.

-- 1. Ensure function exists and is accessible
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role TO service_role;

-- 2. PROFILES
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT
USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE
USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE
USING (public.get_my_role() = 'admin');

-- Ensure users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
USING (auth.uid() = id);


-- 3. ANIMALS
DROP POLICY IF EXISTS "Staff can view all animals" ON animals;
CREATE POLICY "Staff can view all animals" ON animals
  FOR SELECT USING (public.get_my_role() IN ('caregiver', 'admin'));

DROP POLICY IF EXISTS "Staff can insert animals" ON animals;
CREATE POLICY "Staff can insert animals" ON animals
  FOR INSERT WITH CHECK (public.get_my_role() IN ('caregiver', 'admin'));

DROP POLICY IF EXISTS "Staff can update animals" ON animals;
CREATE POLICY "Staff can update animals" ON animals
  FOR UPDATE USING (public.get_my_role() IN ('caregiver', 'admin'));

DROP POLICY IF EXISTS "Staff can delete animals" ON animals;
CREATE POLICY "Staff can delete animals" ON animals
  FOR DELETE USING (public.get_my_role() IN ('caregiver', 'admin'));


-- 4. DAILY REPORTS
DROP POLICY IF EXISTS "Staff can view all reports" ON daily_reports;
CREATE POLICY "Staff can view all reports" ON daily_reports
  FOR SELECT USING (public.get_my_role() IN ('caregiver', 'admin'));

DROP POLICY IF EXISTS "Staff can insert reports" ON daily_reports;
CREATE POLICY "Staff can insert reports" ON daily_reports
  FOR INSERT WITH CHECK (public.get_my_role() IN ('caregiver', 'admin'));


-- 5. STORAGE (Photos)
-- Explicitly using public.get_my_role() here is crucial
DROP POLICY IF EXISTS "Staff can upload animal photos" ON storage.objects;
CREATE POLICY "Staff can upload animal photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'animal-photos' AND
  auth.role() = 'authenticated' AND
  public.get_my_role() IN ('caregiver', 'admin')
);

DROP POLICY IF EXISTS "Staff can update animal photos" ON storage.objects;
CREATE POLICY "Staff can update animal photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'animal-photos' AND
  auth.role() = 'authenticated' AND
  public.get_my_role() IN ('caregiver', 'admin')
);

DROP POLICY IF EXISTS "Staff can delete animal photos" ON storage.objects;
CREATE POLICY "Staff can delete animal photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'animal-photos' AND
  auth.role() = 'authenticated' AND
  public.get_my_role() IN ('caregiver', 'admin')
);
