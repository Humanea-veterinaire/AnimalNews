-- Add assigned_caregiver_id column to animals table
ALTER TABLE animals
ADD COLUMN assigned_caregiver_id uuid REFERENCES profiles(id);
