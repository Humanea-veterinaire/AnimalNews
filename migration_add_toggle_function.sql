-- Create the toggle_report_like function if it doesn't exist
-- This function handles like/unlike operations and returns the updated state

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
