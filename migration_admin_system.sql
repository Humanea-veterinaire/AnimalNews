-- Set initial admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'michael.bennaim@humanea-veterinaire.fr';

-- Enable Row Level Security (RLS) on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow admins to delete other profiles
CREATE POLICY "Admins can delete profiles"
ON profiles
FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Policy to allow admins to update other profiles (e.g. promote to admin)
CREATE POLICY "Admins can update profiles"
ON profiles
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Ensure admins can view all profiles (usually already covered by public select, but good to be sure)
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);
