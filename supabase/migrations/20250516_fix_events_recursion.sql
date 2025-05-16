
-- This migration fixes the infinite recursion issues in the events RLS policies
-- by implementing proper security definer functions and optimizing access checks

-- 1. First, create a more efficient security definer function to check event access
CREATE OR REPLACE FUNCTION public.user_can_access_event_safe(event_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    -- Direct ownership check (user created the event)
    SELECT 1
    FROM events e
    WHERE e.id = event_id_param AND e.creator_id = auth.uid()
  ) OR EXISTS (
    -- User belongs to a family that has access to this event
    SELECT 1
    FROM event_families ef
    JOIN family_members fm ON ef.family_id = fm.family_id
    WHERE ef.event_id = event_id_param 
    AND fm.user_id = auth.uid()
  );
END;
$$;

-- 2. Drop the problematic policies that might cause recursion
DROP POLICY IF EXISTS "Users can view events they created" ON events;
DROP POLICY IF EXISTS "Users can view events shared with their families" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;

-- 3. Create new, optimized policies using the safe function
-- For SELECT operations
CREATE POLICY "Users can view accessible events" 
ON events 
FOR SELECT 
USING (public.user_can_access_event_safe(id));

-- For UPDATE operations
CREATE POLICY "Users can update their own events" 
ON events 
FOR UPDATE 
USING (creator_id = auth.uid());

-- For DELETE operations
CREATE POLICY "Users can delete their own events" 
ON events 
FOR DELETE 
USING (creator_id = auth.uid());

-- For INSERT operations - users can always create events
CREATE POLICY "Users can create events" 
ON events 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Create a function to get all accessible events efficiently
-- Using the same name as referenced in the code
CREATE OR REPLACE FUNCTION public.get_user_accessible_events_safe()
RETURNS SETOF events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  -- Get events created by the user
  SELECT DISTINCT e.*
  FROM events e
  WHERE e.creator_id = auth.uid()
  
  UNION
  
  -- Get events shared with families the user is a member of
  SELECT DISTINCT e.*
  FROM events e
  JOIN event_families ef ON e.id = ef.event_id
  JOIN family_members fm ON ef.family_id = fm.family_id
  WHERE fm.user_id = auth.uid();
END;
$$;

-- 5. Comment to help identify this migration
COMMENT ON FUNCTION public.user_can_access_event_safe IS 'Securely checks if the current user can access an event without causing recursion';
COMMENT ON FUNCTION public.get_user_accessible_events_safe IS 'Retrieves all events accessible to the current user without causing recursion';
