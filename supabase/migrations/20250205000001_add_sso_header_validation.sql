-- Migration: Adicionar função para validar SSO token de requisições HTTP
-- Data: 2025-02-05
-- Descrição: Permite que funções RPC validem autenticação SSO através do header x-sso-token

-- ==============================================
-- REMOVER FUNÇÃO EXISTENTE SE HOUVER
-- ==============================================

DROP FUNCTION IF EXISTS public.get_sso_user_from_header();

-- ==============================================
-- FUNÇÃO PARA OBTER USUÁRIO SSO DO HEADER
-- ==============================================

CREATE OR REPLACE FUNCTION public.get_sso_user_from_header()
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token TEXT;
  _session RECORD;
  _user_email TEXT;
  _user_name TEXT;
BEGIN
  -- Obter token do header da requisição
  -- O header x-sso-token deve ser enviado pelo front-end
  BEGIN
    _token := current_setting('request.headers', true)::json->>'x-sso-token';
  EXCEPTION
    WHEN OTHERS THEN
      _token := NULL;
  END;
  
  -- Se não há token, retornar inválido
  IF _token IS NULL OR _token = '' THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      FALSE::BOOLEAN;
    RETURN;
  END IF;
  
  -- Buscar sessão válida
  SELECT 
    us.user_id,
    rap.email,
    rap.nome
  INTO _session
  FROM user_sessions us
  JOIN rbac_auth_profile rap ON rap.user_id = us.user_id
  WHERE us.session_token = _token
    AND us.expires_at > NOW()
    AND us.status = 'ativo'
  LIMIT 1;
  
  -- Se não encontrou sessão válida
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      FALSE::BOOLEAN;
    RETURN;
  END IF;
  
  -- Retornar dados do usuário
  RETURN QUERY SELECT 
    _session.user_id,
    _session.email,
    _session.nome,
    TRUE::BOOLEAN;
END;
$$;

-- ==============================================
-- PERMISSÕES
-- ==============================================

-- Permitir acesso anônimo (o token valida a autenticação)
GRANT EXECUTE ON FUNCTION public.get_sso_user_from_header() TO anon;
GRANT EXECUTE ON FUNCTION public.get_sso_user_from_header() TO authenticated;

-- ==============================================
-- COMENTÁRIOS
-- ==============================================

COMMENT ON FUNCTION public.get_sso_user_from_header() IS 
'Valida token SSO do header x-sso-token e retorna dados do usuário autenticado. 
Usado por funções RPC que precisam autenticar requisições via SSO. 
Retorna is_valid=false se token não for encontrado ou inválido.';

