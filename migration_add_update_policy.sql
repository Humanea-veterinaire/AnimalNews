-- Fix: Add missing UPDATE policy for caregivers on daily_reports
-- This is the critical missing piece preventing report edits from working

-- Drop the policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Caregivers can update reports" ON daily_reports;

-- Create the UPDATE policy for caregivers
CREATE POLICY "Caregivers can update reports" ON daily_reports
    FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'caregiver')
    );
