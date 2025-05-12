
-- Fix infinite recursion issues in RLS policies by replacing them with proper security definer functions

-- 1. Create a security definer function to safely check if a user is a family member
CREATE OR REPLACE FUNCTION public.get_family_members()
RETURNS SETOF family_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT fm.*
  FROM family_members fm
  JOIN family_members user_membership ON user_membership.family_id = fm.family_id
  WHERE user_membership.user_id = auth.uid()
  ORDER BY fm.email;
END;
$$;

-- 2. Create a function to get all user families safely without recursion
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

-- 3. Fix the structure issues in the get_families_and_members_for_user function
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
  member_role family_role,
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

-- 4. Create a better function for checking if a user is a family member
CREATE OR REPLACE FUNCTION public.is_family_member_safe(family_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM family_members 
    WHERE family_id = family_id_param 
    AND user_id = auth.uid()
  );
END;
$$;

-- 5. Create a function to check if a user is a family admin
CREATE OR REPLACE FUNCTION public.is_family_admin_safe(family_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM family_members 
    WHERE family_id = family_id_param 
    AND user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 6. Now replace the problematic RLS policies
-- First drop the problematic policies
DROP POLICY IF EXISTS "Users can view family members they belong to" ON family_members;
DROP POLICY IF EXISTS "Users can insert family members for families they admin" ON family_members;
DROP POLICY IF EXISTS "Users can update family members for families they admin" ON family_members;
DROP POLICY IF EXISTS "Users can delete family members for families they admin" ON family_members;

-- Create new RLS policies using the security definer functions
CREATE POLICY "Users can view family members they belong to" 
ON family_members 
FOR SELECT 
USING (public.is_family_member_safe(family_id));

CREATE POLICY "Users can insert family members for families they admin" 
ON family_members 
FOR INSERT 
WITH CHECK (public.is_family_admin_safe(family_id));

CREATE POLICY "Users can update family members for families they admin" 
ON family_members 
FOR UPDATE 
USING (public.is_family_admin_safe(family_id));

CREATE POLICY "Users can delete family members for families they admin" 
ON family_members 
FOR DELETE 
USING (public.is_family_admin_safe(family_id));
