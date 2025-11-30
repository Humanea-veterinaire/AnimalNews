-- Create a function to delete a user completely (auth + profile)
-- This can only be called by admins
CREATE OR REPLACE FUNCTION delete_user_completely(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Delete the profile first (will cascade to related data if FK constraints are set)
  DELETE FROM profiles WHERE id = user_id;
  
  -- Delete the auth user (requires service role privileges)
  -- This is safe because the function is SECURITY DEFINER
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;
