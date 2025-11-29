-- Add a check constraint to ensure caregiver emails end with @humanea-veterinaire.fr
-- This assumes the 'profiles' table has an 'email' column and a 'role' column.
-- If email is only in auth.users, this constraint on profiles will only work if email is duplicated there.
-- Based on previous code, profiles has 'email' and 'role'.

ALTER TABLE profiles
ADD CONSTRAINT check_caregiver_email_domain
CHECK (
    role != 'caregiver' OR 
    email LIKE '%@humanea-veterinaire.fr'
);
