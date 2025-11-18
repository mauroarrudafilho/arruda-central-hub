-- Migration: SSO Token Function for External Modules
-- Data: 2025-02-01
-- Descrição: Cria função para gerar tokens SSO para módulos externos

-- ==============================================
-- FUNÇÃO PARA GERAR TOKEN SSO PARA PROJETO
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
SET search_path = public
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

  -- No hub central, todos os usuários autenticados podem acessar
  -- Verificação de acesso simplificada: apenas verificar se está autenticado
  -- (Removida verificação de is_admin ou rbac_user_project_access para facilitar)

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
    -- Gerar novo token único
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

-- ==============================================
-- FUNÇÃO PARA VALIDAR TOKEN SSO
-- ==============================================

CREATE OR REPLACE FUNCTION public.validate_sso_token(
  _token TEXT
)
RETURNS TABLE (
  is_valid BOOLEAN,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  project_id UUID,
  project_slug TEXT,
  project_name TEXT,
  expires_at TIMESTAMPTZ,
  permissions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _session RECORD;
  _user_permissions JSONB := '[]'::jsonb;
  _user_email TEXT;
  _user_name TEXT;
  _project_slug TEXT;
  _project_name TEXT;
BEGIN
  -- Buscar sessão válida
  SELECT 
    us.user_id,
    us.project_id,
    us.expires_at,
    us.frontend_module
  INTO _session
  FROM user_sessions us
  WHERE us.session_token = _token
    AND us.expires_at > NOW()
    AND us.status = 'ativo';

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TIMESTAMPTZ,
      '[]'::JSONB;
    RETURN;
  END IF;

  -- Buscar informações do usuário (qualificar user_id para evitar ambiguidade)
  SELECT rap.email, rap.nome INTO _user_email, _user_name
  FROM rbac_auth_profile rap
  WHERE rap.user_id = _session.user_id;

  SELECT rp.slug, rp.nome INTO _project_slug, _project_name
  FROM rbac_projects rp
  WHERE rp.id = _session.project_id;

  -- Buscar permissões do usuário
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'permission', ap.nome,
        'module', ap.modulo,
        'action', ap.acao,
        'granted', true
      )
    ),
    '[]'::jsonb
  ) INTO _user_permissions
  FROM rbac_auth_user_role aur
  JOIN rbac_auth_role_permission arp ON arp.role_id = aur.role_id
  JOIN rbac_auth_permission ap ON ap.id = arp.permission_id
  WHERE aur.user_id = _session.user_id
    AND aur.ativo = true;

  -- Atualizar última atividade
  UPDATE user_sessions 
  SET last_activity = NOW(),
      updated_at = NOW()
  WHERE session_token = _token;

  -- Retornar resultado
  RETURN QUERY SELECT 
    TRUE::BOOLEAN,
    _session.user_id,
    _user_email,
    _user_name,
    _session.project_id,
    _project_slug,
    _project_name,
    _session.expires_at,
    _user_permissions;
END;
$$;

-- Comentários
COMMENT ON FUNCTION public.generate_sso_token IS 'Gera token SSO para acesso a módulos externos. No hub central, todos os usuários autenticados podem acessar. Token expira em 12 horas. Reutiliza token existente se ainda válido.';
COMMENT ON FUNCTION public.validate_sso_token IS 'Valida token SSO e retorna informações do usuário e permissões';

