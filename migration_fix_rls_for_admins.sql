-- Update RLS policies to include 'admin' role for Animals
DROP POLICY IF EXISTS "Caregivers can view all animals" ON animals;
DROP POLICY IF EXISTS "Caregivers can insert animals" ON animals;
DROP POLICY IF EXISTS "Caregivers can update animals" ON animals;
DROP POLICY IF EXISTS "Caregivers can delete animals" ON animals; -- In case it exists

CREATE POLICY "Staff can view all animals" ON animals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('caregiver', 'admin'))
  );

CREATE POLICY "Staff can insert animals" ON animals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('caregiver', 'admin'))
  );

CREATE POLICY "Staff can update animals" ON animals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('caregiver', 'admin'))
  );

CREATE POLICY "Staff can delete animals" ON animals
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('caregiver', 'admin'))
  );

-- Update RLS policies for Daily Reports
DROP POLICY IF EXISTS "Caregivers can view all reports" ON daily_reports;
DROP POLICY IF EXISTS "Caregivers can insert reports" ON daily_reports;

CREATE POLICY "Staff can view all reports" ON daily_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('caregiver', 'admin'))
  );

CREATE POLICY "Staff can insert reports" ON daily_reports
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('caregiver', 'admin'))
  );

-- Update RLS policies for Owner Connections
DROP POLICY IF EXISTS "Caregivers can view connections" ON owner_connections;

CREATE POLICY "Staff can view connections" ON owner_connections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('caregiver', 'admin'))
  );
