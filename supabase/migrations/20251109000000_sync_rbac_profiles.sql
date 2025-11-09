-- Migration: Ensure RBAC profiles stay in sync with Supabase Auth users
-- Date: 2025-11-09
-- Description: Backfill missing RBAC profiles for active users and create trigger for new users

-- ==============================================
-- BACKFILL RBAC PROFILES FOR EXISTING USERS
-- ==============================================

DO $$
DECLARE
  default_org uuid;
BEGIN
  SELECT id INTO default_org
  FROM public.rbac_organizations
  WHERE slug = 'grupo-arruda'
  ORDER BY created_at
  LIMIT 1;

  INSERT INTO public.rbac_auth_profile (
    user_id,
    nome,
    email,
    status,
    avatar_url,
    telefone,
    cargo,
    departamento,
    time_id,
    ultimo_login,
    organizacao_id
  )
  SELECT
    u.id,
    COALESCE(
      NULLIF(trim(u.raw_user_meta_data->>'nome'), ''),
      NULLIF(trim(u.raw_user_meta_data->>'name'), ''),
      split_part(u.email, '@', 1)
    ) AS nome,
    COALESCE(
      u.email,
      NULLIF(trim(u.raw_user_meta_data->>'email'), ''),
      concat(u.id::text, '@no-email.local')
    ) AS email,
    CASE
      WHEN u.deleted_at IS NOT NULL THEN 'inativo'
      WHEN u.email_confirmed_at IS NOT NULL
        OR u.phone_confirmed_at IS NOT NULL
        OR u.last_sign_in_at IS NOT NULL THEN 'ativo'
      ELSE 'inativo'
    END AS status,
    NULLIF(trim(u.raw_user_meta_data->>'avatar_url'), '') AS avatar_url,
    NULLIF(trim(COALESCE(u.raw_user_meta_data->>'telefone', u.raw_user_meta_data->>'phone')), '') AS telefone,
    NULLIF(trim(u.raw_user_meta_data->>'cargo'), '') AS cargo,
    NULLIF(trim(u.raw_user_meta_data->>'departamento'), '') AS departamento,
    NULLIF(trim(u.raw_user_meta_data->>'time_id'), '') AS time_id,
    u.last_sign_in_at,
    CASE
      WHEN (u.raw_user_meta_data->>'organizacao_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN (u.raw_user_meta_data->>'organizacao_id')::uuid
      ELSE default_org
    END AS organizacao_id
  FROM auth.users u
  LEFT JOIN public.rbac_auth_profile ap ON ap.user_id = u.id
  WHERE ap.user_id IS NULL
    AND u.deleted_at IS NULL;
END $$;

-- ==============================================
-- TRIGGER TO SYNC FUTURE USERS
-- ==============================================

CREATE OR REPLACE FUNCTION public.sync_rbac_profile_from_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_org uuid;
  target_org uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.rbac_auth_profile WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  SELECT id INTO default_org
  FROM public.rbac_organizations
  WHERE slug = 'grupo-arruda'
  ORDER BY created_at
  LIMIT 1;

  target_org := NULL;

  IF NEW.raw_user_meta_data ? 'organizacao_id'
     AND NEW.raw_user_meta_data->>'organizacao_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    target_org := (NEW.raw_user_meta_data->>'organizacao_id')::uuid;
  END IF;

  INSERT INTO public.rbac_auth_profile (
    user_id,
    nome,
    email,
    status,
    avatar_url,
    telefone,
    cargo,
    departamento,
    time_id,
    ultimo_login,
    organizacao_id
  ) VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'nome'), ''),
      NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.email,
      NULLIF(trim(NEW.raw_user_meta_data->>'email'), ''),
      concat(NEW.id::text, '@no-email.local')
    ),
    CASE
      WHEN NEW.deleted_at IS NOT NULL THEN 'inativo'
      WHEN NEW.email_confirmed_at IS NOT NULL
        OR NEW.phone_confirmed_at IS NOT NULL
        OR NEW.last_sign_in_at IS NOT NULL THEN 'ativo'
      ELSE 'inativo'
    END,
    NULLIF(trim(NEW.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'telefone', NEW.raw_user_meta_data->>'phone')), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'cargo'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'departamento'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'time_id'), ''),
    NEW.last_sign_in_at,
    COALESCE(target_org, default_org)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_rbac_profile_on_auth_users ON auth.users;

CREATE TRIGGER sync_rbac_profile_on_auth_users
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_rbac_profile_from_auth_user();
