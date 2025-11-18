-- Migration: Fix SSO Token Generation - Enable pgcrypto extension
-- Data: 2025-02-01
-- Descrição: Habilita extensão pgcrypto e corrige função generate_sso_token

-- ==============================================
-- HABILITAR EXTENSÃO pgcrypto
-- ==============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================================
-- CORRIGIR FUNÇÃO generate_sso_token
-- ==============================================

CREATE OR REPLACE FUNCTION public.generate_sso_token(
  _project_slug TEXT
)
RETURNS TABLE (
  token TEXT,
  expires_at TIMESTAMPTZ,
  project_id UUID,
  project_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _user_id UUID;
  _project_record RECORD;
  _session_token TEXT;
  _expires_at TIMESTAMPTZ;
  _existing_session RECORD;
BEGIN
  -- Verificar se o usuário está autenticado
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Buscar projeto pelo slug
  SELECT id, nome, slug INTO _project_record
  FROM rbac_projects
  WHERE slug = _project_slug
    AND status = 'ativo';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Projeto não encontrado: %', _project_slug;
  END IF;

  -- Verificar se já existe sessão ativa para este usuário e módulo
  SELECT us.session_token, us.expires_at INTO _existing_session
  FROM user_sessions us
  WHERE us.user_id = _user_id
    AND us.frontend_module = _project_slug
    AND us.status = 'ativo'
    AND us.expires_at > NOW()
  ORDER BY us.created_at DESC
  LIMIT 1;

  IF FOUND AND _existing_session.expires_at > NOW() THEN
    -- Reutilizar token existente se ainda válido
    _session_token := _existing_session.session_token;
    _expires_at := _existing_session.expires_at;
    
    -- Atualizar última atividade
    UPDATE user_sessions
    SET 
      last_activity = NOW(),
      updated_at = NOW()
    WHERE user_id = _user_id
      AND frontend_module = _project_slug
      AND session_token = _session_token;
  ELSE
    -- Gerar novo token único usando gen_random_bytes do schema extensions (Supabase)
    _session_token := encode(gen_random_bytes(32), 'base64');
    
    -- Definir expiração (12 horas)
    _expires_at := NOW() + INTERVAL '12 hours';

    -- Inserir nova sessão ou atualizar existente (mesmo que expirada)
    INSERT INTO user_sessions (
      user_id,
      project_id,
      session_token,
      frontend_module,
      frontend_origin,
      expires_at,
      last_activity,
      status
    ) VALUES (
      _user_id,
      _project_record.id,
      _session_token,
      _project_slug,
      COALESCE(
        current_setting('request.headers', true)::json->>'origin',
        'arruda-central-hub'
      ),
      _expires_at,
      NOW(),
      'ativo'
    )
    ON CONFLICT (user_id, frontend_module)
    DO UPDATE SET
      session_token = _session_token,
      project_id = _project_record.id,
      expires_at = _expires_at,
      last_activity = NOW(),
      updated_at = NOW(),
      status = 'ativo',
      frontend_origin = COALESCE(
        current_setting('request.headers', true)::json->>'origin',
        'arruda-central-hub'
      );
  END IF;

  -- Retornar token e informações
  RETURN QUERY SELECT 
    _session_token,
    _expires_at,
    _project_record.id,
    _project_record.nome;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro e re-raise
    RAISE EXCEPTION 'Erro ao gerar token SSO: %', SQLERRM;
END;
$$;

-- Comentários
COMMENT ON FUNCTION public.generate_sso_token IS 'Gera token SSO para acesso a módulos externos. Usa gen_random_bytes do schema extensions para gerar tokens seguros. Token expira em 12 horas.';

