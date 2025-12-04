-- Migration to fix email verification flow
-- This ensures that profiles are only created AFTER email confirmation

-- Drop the existing trigger to recreate it with the new logic
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function to check for email confirmation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only create profile if email is confirmed AND email domain is correct
  IF new.email LIKE '%@humanea-veterinaire.fr' AND new.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (id, first_name, last_name, email, role)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'first_name',
      new.raw_user_meta_data->>'last_name',
      new.email,
      'caregiver'
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  END IF;
  RETURN new;
END;
$$;

-- Create trigger for new user insertion (will only fire if email is already confirmed)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for email confirmation (handles confirmation after signup)
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (old.email_confirmed_at IS NULL AND new.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Note: This migration does NOT affect existing profiles.
-- Only new signups will require email verification before appearing in the admin dashboard.
