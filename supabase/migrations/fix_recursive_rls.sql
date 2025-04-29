
-- Create security definer function to get user families
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
  SELECT f.*
  FROM families f
  JOIN family_members fm ON f.id = fm.family_id
  WHERE fm.user_id = auth.uid()
  ORDER BY f.name;
END;
$$;

-- Create security definer function to get family members
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

-- Create security definer function to create a family
CREATE OR REPLACE FUNCTION public.create_family(family_name text)
RETURNS families
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_family families;
BEGIN
  -- Insert the family
  INSERT INTO families (name, created_by)
  VALUES (family_name, auth.uid())
  RETURNING * INTO new_family;
  
  -- Add the creator as an admin member
  INSERT INTO family_members (family_id, user_id, email, role, name)
  SELECT 
    new_family.id,
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'admin'::family_role,
    COALESCE(
      (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()),
      (SELECT email FROM auth.users WHERE id = auth.uid())
    );
    
  RETURN new_family;
END;
$$;

-- Create security definer function to invite a family member
CREATE OR REPLACE FUNCTION public.invite_family_member(
  p_family_id uuid,
  p_email text,
  p_name text,
  p_role text,
  p_invited_by uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the user has permission to invite to this family
  IF NOT EXISTS (
    SELECT 1 FROM family_members 
    WHERE family_id = p_family_id 
    AND user_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'You do not have permission to invite members to this family';
  END IF;

  -- Insert or update the invitation
  INSERT INTO invitations (
    family_id,
    email,
    name,
    role,
    last_invited,
    invited_by
  )
  VALUES (
    p_family_id,
    p_email,
    p_name,
    p_role::family_role,
    now(),
    p_invited_by
  )
  ON CONFLICT (family_id, email) 
  DO UPDATE SET
    name = p_name,
    role = p_role::family_role,
    last_invited = now(),
    invited_by = p_invited_by;
    
  RETURN true;
END;
$$;
