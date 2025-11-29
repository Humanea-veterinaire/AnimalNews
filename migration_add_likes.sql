-- Add likes column to daily_reports
ALTER TABLE daily_reports 
ADD COLUMN likes integer DEFAULT 0 NOT NULL;

-- Create a secure function to increment likes
-- This allows owners (who don't have update permissions) to "like" a report
CREATE OR REPLACE FUNCTION increment_report_likes(report_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE daily_reports
  SET likes = likes + 1
  WHERE id = report_id;
$$;
