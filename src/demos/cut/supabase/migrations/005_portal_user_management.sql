-- Migration 005: Portal user management RPC functions
-- Allows admin panel to create, delete, and reset passwords for portal users
-- without exposing the service_role key in the browser.
-- All functions use SECURITY DEFINER and check is_cut_admin().

-- ============================================================
-- RLS Policy: Admins can manage portal users
-- (idempotent — drop if exists, then recreate)
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage portal users" ON public.cut_portal_users;
CREATE POLICY "Admins can manage portal users"
  ON public.cut_portal_users FOR ALL
  TO authenticated
  USING (is_cut_admin())
  WITH CHECK (is_cut_admin());

-- ============================================================
-- Function: create_portal_user
-- Creates a Supabase auth user + cut_portal_users record
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_portal_user(
  p_tenant_id UUID,
  p_email TEXT,
  p_password TEXT,
  p_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'admin'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Only admins can call this
  IF NOT public.is_cut_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Validate role
  IF p_role NOT IN ('admin', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role. Must be admin or viewer.';
  END IF;

  -- Check tenant exists
  IF NOT EXISTS (SELECT 1 FROM public.cut_tenants WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'Tenant not found';
  END IF;

  -- Check email not already used
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(p_email)) THEN
    RAISE EXCEPTION 'A user with this email already exists';
  END IF;

  -- Generate user ID
  v_user_id := gen_random_uuid();

  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    confirmation_token,
    recovery_token
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    lower(p_email),
    crypt(p_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    COALESCE(
      jsonb_build_object('name', p_name),
      '{}'::jsonb
    ),
    'authenticated',
    'authenticated',
    '',
    ''
  );

  -- Insert into auth.identities (required for email/password login)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', lower(p_email)),
    'email',
    v_user_id::text,
    NOW(),
    NOW(),
    NOW()
  );

  -- Insert into cut_portal_users
  INSERT INTO public.cut_portal_users (auth_user_id, tenant_id, email, name, role)
  VALUES (v_user_id, p_tenant_id, lower(p_email), p_name, p_role);

  RETURN json_build_object(
    'user_id', v_user_id,
    'email', lower(p_email),
    'name', p_name,
    'role', p_role
  );
END;
$$;

-- ============================================================
-- Function: delete_portal_user
-- Removes auth user + cut_portal_users record
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_portal_user(
  p_portal_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_email TEXT;
BEGIN
  -- Only admins can call this
  IF NOT public.is_cut_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Look up the portal user
  SELECT auth_user_id, email INTO v_auth_user_id, v_email
  FROM public.cut_portal_users
  WHERE id = p_portal_user_id;

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Portal user not found';
  END IF;

  -- Delete portal user record
  DELETE FROM public.cut_portal_users WHERE id = p_portal_user_id;

  -- Delete auth user (cascades to auth.identities)
  DELETE FROM auth.users WHERE id = v_auth_user_id;

  RETURN json_build_object('deleted', v_email);
END;
$$;

-- ============================================================
-- Function: reset_portal_user_password
-- Updates the auth user's password
-- ============================================================

CREATE OR REPLACE FUNCTION public.reset_portal_user_password(
  p_portal_user_id UUID,
  p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_email TEXT;
BEGIN
  -- Only admins can call this
  IF NOT public.is_cut_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Look up the portal user
  SELECT auth_user_id, email INTO v_auth_user_id, v_email
  FROM public.cut_portal_users
  WHERE id = p_portal_user_id;

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Portal user not found';
  END IF;

  -- Update password
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE id = v_auth_user_id;

  RETURN json_build_object('reset', v_email);
END;
$$;
