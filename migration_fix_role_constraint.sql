-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint including 'admin'
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('owner', 'caregiver', 'admin'));

-- Now you can run the update again
UPDATE profiles
SET role = 'admin'
WHERE email = 'michael.bennaim@humanea-veterinaire.fr';
