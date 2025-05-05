
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
