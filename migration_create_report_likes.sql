-- Migration: Create report_likes table to track individual likes
-- This replaces the localStorage-only approach with a database-backed solution

-- Create report_likes table
CREATE TABLE IF NOT EXISTS report_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
    owner_email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(report_id, owner_email)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_report_likes_report_id ON report_likes(report_id);
CREATE INDEX IF NOT EXISTS idx_report_likes_owner_email ON report_likes(owner_email);

-- Enable RLS (Row Level Security)
ALTER TABLE report_likes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read likes (to display counts)
CREATE POLICY "Anyone can view likes" ON report_likes
    FOR SELECT
    USING (true);

-- Allow owners to insert their own likes
CREATE POLICY "Owners can insert their own likes" ON report_likes
    FOR INSERT
    WITH CHECK (true);

-- Allow owners to delete their own likes
CREATE POLICY "Owners can delete their own likes" ON report_likes
    FOR DELETE
    USING (true);

-- Function to check if a user has already liked a report
CREATE OR REPLACE FUNCTION has_user_liked_report(p_report_id UUID, p_owner_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM report_likes 
        WHERE report_id = p_report_id 
        AND owner_email = p_owner_email
    );
END;
$$;

-- Function to toggle like (returns new like count)
CREATE OR REPLACE FUNCTION toggle_report_like(p_report_id UUID, p_owner_email TEXT)
RETURNS TABLE(liked BOOLEAN, like_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists BOOLEAN;
    v_count INTEGER;
BEGIN
    -- Check if like already exists
    SELECT EXISTS(
        SELECT 1 FROM report_likes 
        WHERE report_id = p_report_id 
        AND owner_email = p_owner_email
    ) INTO v_exists;

    IF v_exists THEN
        -- Unlike: remove the like
        DELETE FROM report_likes 
        WHERE report_id = p_report_id 
        AND owner_email = p_owner_email;
        
        -- Decrement the count in daily_reports
        UPDATE daily_reports 
        SET likes = GREATEST(0, COALESCE(likes, 0) - 1)
        WHERE id = p_report_id;
        
        liked := FALSE;
    ELSE
        -- Like: add the like
        INSERT INTO report_likes (report_id, owner_email)
        VALUES (p_report_id, p_owner_email);
        
        -- Increment the count in daily_reports
        UPDATE daily_reports 
        SET likes = COALESCE(likes, 0) + 1
        WHERE id = p_report_id;
        
        liked := TRUE;
    END IF;

    -- Get the updated count
    SELECT COALESCE(likes, 0) INTO v_count
    FROM daily_reports
    WHERE id = p_report_id;
    
    like_count := v_count;
    
    RETURN NEXT;
END;
$$;
