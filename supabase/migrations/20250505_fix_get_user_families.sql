
-- Fix the get_user_families function to handle the return type correctly
CREATE OR REPLACE FUNCTION public.get_user_families()
RETURNS TABLE (
  id uuid,
  name text,
  color text,
  created_by uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.name, f.color, f.created_by, f.created_at
  FROM families f
  JOIN family_members fm ON f.id = fm.family_id
  WHERE fm.user_id = auth.uid()
  ORDER BY f.name;
END;
$$;

-- Create a new get_families_and_members function that gets both families and members in one call
CREATE OR REPLACE FUNCTION public.get_families_and_members_for_user()
RETURNS TABLE (
  family_id uuid,
  family_name text,
  family_color text,
  family_created_by uuid,
  family_created_at timestamptz,
  member_id uuid,
  member_user_id uuid,
  member_email text,
  member_role public.family_role,
  member_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id AS family_id, 
    f.name AS family_name,
    f.color AS family_color,
    f.created_by AS family_created_by,
    f.created_at AS family_created_at,
    fm.id AS member_id,
    fm.user_id AS member_user_id,
    fm.email AS member_email,
    fm.role AS member_role,
    fm.name AS member_name
  FROM families f
  JOIN family_members fm ON f.id = fm.family_id
  WHERE EXISTS (
    SELECT 1 
    FROM family_members my_membership
    WHERE my_membership.family_id = f.id
    AND my_membership.user_id = auth.uid()
  )
  ORDER BY f.name, fm.role;
END;
$$;

-- Drop problematic RLS policies and replace them with ones using security definer functions
DROP POLICY IF EXISTS "Users can view family members they belong to" ON family_members;
DROP POLICY IF EXISTS "Users can insert family members for families they admin" ON family_members;
DROP POLICY IF EXISTS "Users can update family members for families they admin" ON family_members;
DROP POLICY IF EXISTS "Users can delete family members for families they admin" ON family_members;

-- Create new RLS policies using the security definer functions
CREATE POLICY "Users can view family members they belong to" 
ON family_members 
FOR SELECT 
USING (public.safe_is_family_member(family_id));

CREATE POLICY "Users can insert family members for families they admin" 
ON family_members 
FOR INSERT 
WITH CHECK (public.safe_is_family_admin(family_id));

CREATE POLICY "Users can update family members for families they admin" 
ON family_members 
FOR UPDATE 
USING (public.safe_is_family_admin(family_id));

CREATE POLICY "Users can delete family members for families they admin" 
ON family_members 
FOR DELETE 
USING (public.safe_is_family_admin(family_id));
