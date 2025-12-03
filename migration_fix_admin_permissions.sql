-- Fix Report Editing Permissions for Admins
-- This migration must be executed in Supabase SQL Editor

-- Update the policy to allow both 'caregiver' and 'admin' roles to update reports
DROP POLICY IF EXISTS "Caregivers can update reports" ON daily_reports;

CREATE POLICY "Caregivers and Admins can update reports" ON daily_reports
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('caregiver', 'admin')
        )
    );
