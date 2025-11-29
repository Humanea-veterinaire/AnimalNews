-- Create a secure function to decrement likes
-- This allows owners to "unlike" a report
CREATE OR REPLACE FUNCTION decrement_report_likes(report_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE daily_reports
  SET likes = GREATEST(0, likes - 1)
  WHERE id = report_id;
$$;
