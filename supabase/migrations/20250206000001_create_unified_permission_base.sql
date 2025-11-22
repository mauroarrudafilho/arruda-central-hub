-- Migration: Create Unified Permission Base Functions
-- Data: 2025-02-06
-- Descrição: Cria funções auxiliares unificadas que serão usadas por RLS policies e RPC functions
-- Parte do sistema unificado RLS-RPC

-- ==============================================
-- FUNÇÃO UNIVERSAL PARA BUSCAR DADOS DO USUÁRIO
-- ==============================================

-- Esta função busca dados do usuário tanto por UUID (Supabase Auth) quanto por email (SSO)
-- É a fonte única de verdade para obter dados do usuário no sistema

CREATE OR REPLACE FUNCTION public.get_user_data_unified(
  p_user_id UUID DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  nome TEXT,
  email TEXT,
  papel TEXT,
  ativo BOOLEAN,
  organizacao_id UUID,
  distribuidor TEXT,
  regional TEXT,
  rede TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sso_user RECORD;
  _user_uuid UUID;
  _found_user BOOLEAN := FALSE;
BEGIN
  -- PRIORIDADE 1: Se veio user_id, usar direto
  IF p_user_id IS NOT NULL THEN
    _user_uuid := p_user_id;
    _found_user := TRUE;
  -- PRIORIDADE 2: Se veio email, buscar via profile
  ELSIF p_user_email IS NOT NULL THEN
    SELECT user_id INTO _user_uuid
    FROM rbac_auth_profile
    WHERE email = p_user_email 
      AND status = 'ativo'
    LIMIT 1;
    
    IF FOUND THEN
      _found_user := TRUE;
    END IF;
  -- PRIORIDADE 3: Tentar via SSO header (se estiver disponível)
  ELSE
    BEGIN
      SELECT * INTO _sso_user FROM public.get_sso_user_from_header();
      IF _sso_user.is_valid THEN
        _user_uuid := _sso_user.user_id;
        p_user_email := _sso_user.user_email;
        _found_user := TRUE;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Função não disponível ou erro, continuar
        NULL;
    END;
    
    -- PRIORIDADE 4: Usar auth.uid() como fallback
    IF NOT _found_user THEN
      _user_uuid := auth.uid();
      IF _user_uuid IS NOT NULL THEN
        _found_user := TRUE;
      END IF;
    END IF;
  END IF;
  
  -- Se não encontrou usuário, retornar vazio
  IF NOT _found_user OR _user_uuid IS NULL THEN
    RETURN;
  END IF;
  
  -- Retornar dados do usuário
  RETURN QUERY
  SELECT 
    ap.user_id as id,
    ap.nome,
    ap.email,
    public.get_user_role_v2(ap.user_id) as papel, -- Usar versão consolidada
    (ap.status = 'ativo')::BOOLEAN as ativo,
    ap.organizacao_id,
    ap.distribuidor,
    NULL::TEXT as regional, -- Campo não existe na tabela atual, manter NULL
    NULL::TEXT as rede -- Campo não existe na tabela atual, manter NULL
  FROM rbac_auth_profile ap
  WHERE ap.user_id = _user_uuid
    AND ap.status = 'ativo'
  LIMIT 1;
  
  -- Se não encontrou no profile, retornar dados mínimos do auth.users
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      au.id,
      COALESCE(
        NULLIF(trim(au.raw_user_meta_data->>'nome'), ''),
        NULLIF(trim(au.raw_user_meta_data->>'name'), ''),
        split_part(COALESCE(au.email, ''), '@', 1)
      )::TEXT as nome,
      COALESCE(au.email, '')::TEXT as email,
      public.get_user_role_v2(au.id) as papel,
      CASE 
        WHEN au.deleted_at IS NOT NULL THEN FALSE
        WHEN au.email_confirmed_at IS NOT NULL OR au.phone_confirmed_at IS NOT NULL THEN TRUE
        ELSE FALSE
      END as ativo,
      NULL::UUID as organizacao_id,
      NULL::TEXT as distribuidor,
      NULL::TEXT as regional,
      NULL::TEXT as rede
    FROM auth.users au
    WHERE au.id = _user_uuid
    LIMIT 1;
  END IF;
END;
$$;

-- ==============================================
-- FUNÇÃO UNIVERSAL DE ROTEAMENTO
-- ==============================================

-- Esta função roteia chamadas para funções específicas de cada tabela
-- Permite verificação genérica de permissão para qualquer tabela

CREATE OR REPLACE FUNCTION public.can_user_view_table(
  p_table_name TEXT,
  p_user_id UUID DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_data RECORD;
BEGIN
  -- Obter dados do usuário usando função unificada
  SELECT * INTO _user_data
  FROM public.get_user_data_unified(p_user_id, p_user_email)
  LIMIT 1;
  
  -- Se não encontrou usuário, sem acesso
  IF NOT FOUND OR _user_data.ativo = FALSE THEN
    RETURN FALSE;
  END IF;
  
  -- Roteamento para funções específicas por tabela
  -- Esta função será atualizada na próxima migration após criação das funções específicas
  CASE p_table_name
    WHEN 'acordos' THEN
      -- Verificar se função específica existe
      IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'can_user_view_acordo') THEN
        RETURN public.can_user_view_acordo(
          COALESCE(p_user_id, _user_data.id),
          COALESCE(p_user_email, _user_data.email),
          p_record_id
        );
      ELSE
        -- Função ainda não existe, retornar FALSE
        RETURN FALSE;
      END IF;
    -- Adicionar mais tabelas conforme necessário
    -- WHEN 'clientes_acordos' THEN ...
    -- WHEN 'usuarios_acordos' THEN ...
    ELSE
      -- Tabela não suportada ainda
      RETURN FALSE;
  END CASE;
END;
$$;

-- ==============================================
-- PERMISSÕES
-- ==============================================

-- Permitir acesso para funções autenticadas
GRANT EXECUTE ON FUNCTION public.get_user_data_unified(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_data_unified(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.can_user_view_table(TEXT, UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_view_table(TEXT, UUID, TEXT, UUID) TO anon;

-- ==============================================
-- COMENTÁRIOS
-- ==============================================

COMMENT ON FUNCTION public.get_user_data_unified(UUID, TEXT) IS 
'Função universal para buscar dados do usuário. Busca por UUID (Supabase Auth) ou email (SSO).
Retorna estrutura unificada com papel, ativo, organizações. Usada por RLS policies e RPC functions.
Esta é a fonte única de verdade para dados do usuário no sistema unificado RLS-RPC.';

COMMENT ON FUNCTION public.can_user_view_table(TEXT, UUID, TEXT, UUID) IS 
'Função universal de roteamento para verificar permissão de visualização em qualquer tabela.
Roteia chamadas para funções específicas de cada tabela (ex: can_user_view_acordo).
Permite verificação genérica de permissão.';
