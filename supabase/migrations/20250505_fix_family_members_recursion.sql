
-- Create a security definer function to safely check if a user is a family member
-- This avoids the infinite recursion issue in RLS policies
CREATE OR REPLACE FUNCTION public.safe_is_family_member(p_family_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.family_members 
    WHERE family_id = p_family_id 
    AND user_id = auth.uid()
  );
END;
$$;

-- Create a security definer function to check if a user is a family admin
CREATE OR REPLACE FUNCTION public.safe_is_family_admin(p_family_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.family_members 
    WHERE family_id = p_family_id 
    AND user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Create a security definer function to safely create a family with conflict handling
CREATE OR REPLACE FUNCTION public.safe_create_family(p_name text, p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_family_id uuid;
  user_email text;
BEGIN
  -- Insert the new family
  INSERT INTO public.families (name, created_by)
  VALUES (p_name, p_user_id)
  RETURNING id INTO new_family_id;
  
  -- Get user's email safely
  SELECT email INTO user_email FROM auth.users WHERE id = p_user_id;
  
  -- Add the creator as an admin member with conflict handling
  INSERT INTO public.family_members (family_id, user_id, email, role, name)
  VALUES (
    new_family_id,
    p_user_id,
    user_email,
    'admin'::family_role,
    COALESCE(
      (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = p_user_id),
      user_email
    )
  )
  ON CONFLICT (family_id, user_id) DO NOTHING; -- Added conflict handling
    
  RETURN new_family_id;
END;
$$;

-- Drop existing RLS policies that might be causing recursion issues
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
