
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
CREATE OR REPLACE FUNCTION public.get_family_members(p_family_ids uuid[])
RETURNS SETOF family_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT fm.*
  FROM family_members fm
  WHERE fm.family_id = ANY(p_family_ids)
  ORDER BY fm.email;
END;
$$;
