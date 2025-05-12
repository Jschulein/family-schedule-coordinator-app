
-- Fix safe_create_family function to work properly with transactions
-- and avoid duplicate family member creation
CREATE OR REPLACE FUNCTION public.safe_create_family(p_name text, p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_family_id uuid;
  user_email text;
  existing_family_id uuid;
BEGIN
  -- Start transaction for atomicity
  BEGIN
    -- First check if a family with this name already exists for this user
    SELECT id INTO existing_family_id 
    FROM public.families 
    WHERE name = p_name AND created_by = p_user_id
    LIMIT 1;
    
    IF existing_family_id IS NOT NULL THEN
      -- Family already exists, return existing ID
      RETURN existing_family_id;
    END IF;

    -- Insert the new family
    INSERT INTO public.families (name, created_by)
    VALUES (p_name, p_user_id)
    RETURNING id INTO new_family_id;
    
    -- Get user's email safely
    SELECT email INTO user_email FROM auth.users WHERE id = p_user_id;
    
    -- Add the creator as an admin member - using explicit ON CONFLICT handling
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
    ON CONFLICT (family_id, user_id) DO NOTHING;
    
    -- If we got this far, commit the transaction
    RETURN new_family_id;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but return the family ID if it was created
    RAISE NOTICE 'Error in safe_create_family: %', SQLERRM;
    
    -- If we already created the family but had an error with family_members,
    -- still return the family ID so the client can recover
    IF new_family_id IS NOT NULL THEN
      RETURN new_family_id;
    END IF;
    
    -- Re-raise the exception
    RAISE;
  END;
END;
$$;

-- Check if handle_new_family trigger exists and drop it to avoid duplicate inserts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'handle_new_family_trigger'
  ) THEN
    DROP TRIGGER IF EXISTS handle_new_family_trigger ON public.families;
  END IF;
END $$;

-- Create a function to safely check if a user belongs to a family without recursion
CREATE OR REPLACE FUNCTION public.get_user_families_safe()
RETURNS TABLE (id uuid, name text, color text, created_by uuid, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Ensure family_members has a unique constraint to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'family_members_family_id_user_id_key'
  ) THEN
    ALTER TABLE public.family_members 
    ADD CONSTRAINT family_members_family_id_user_id_key 
    UNIQUE (family_id, user_id);
  END IF;
END $$;

-- Add a diagnostic function to help with debugging
CREATE OR REPLACE FUNCTION public.debug_family_creation(p_name text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Check if user exists
  result = jsonb_build_object(
    'user_exists', EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id),
    'user_email', (SELECT email FROM auth.users WHERE id = p_user_id),
    'existing_family', (
      SELECT jsonb_build_object('id', id, 'name', name)
      FROM families
      WHERE name = p_name AND created_by = p_user_id
      LIMIT 1
    ),
    'family_members', (
      SELECT jsonb_agg(jsonb_build_object('id', id, 'family_id', family_id, 'user_id', user_id, 'email', email))
      FROM family_members
      WHERE user_id = p_user_id
    ),
    'member_constraints', (
      SELECT jsonb_agg(c.conname)
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      WHERE n.nspname = 'public'
      AND t.relname = 'family_members'
      AND c.contype = 'u'
    )
  );
  
  RETURN result;
END;
$$;
