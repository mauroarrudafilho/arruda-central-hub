-- Migration: Create get_acordos_sso RPC Function
-- Data: 2025-02-06
-- Descrição: Cria função RPC SSO para buscar acordos usando mesma lógica das RLS policies
-- Parte do sistema unificado RLS-RPC

-- ==============================================
-- FUNÇÃO RPC SSO PARA BUSCAR ACORDOS
-- ==============================================

-- Esta função usa a mesma lógica das RLS policies através das funções auxiliares
-- É a fonte única de verdade para SSO, compartilhada com RLS

CREATE OR REPLACE FUNCTION public.get_acordos_sso(
  p_user_email TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  anexo_url TEXT,
  atualizado_em TIMESTAMPTZ,
  cliente_id UUID,
  comprador_id UUID,
  criado_em TIMESTAMPTZ,
  data_negociacao DATE,
  detalhes_acordo TEXT,
  formato_abatimento TEXT,
  justificativa TEXT,
  mes_previsto_abatimento TEXT,
  numero_acordo TEXT,
  regional TEXT,
  status TEXT,
  tipo TEXT,
  tipo_acordo_id UUID,
  uf TEXT,
  valor NUMERIC,
  vendedor_id UUID,
  organizacao_slug TEXT,
  tenant_id UUID
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sso_user RECORD;
  _user_email_to_use TEXT;
  _where_filter TEXT;
BEGIN
  -- PRIORIDADE 1: Usar email fornecido como parâmetro
  IF p_user_email IS NOT NULL AND p_user_email != '' THEN
    _user_email_to_use := p_user_email;
  -- PRIORIDADE 2: Tentar obter email via SSO header
  ELSE
    SELECT * INTO _sso_user FROM public.get_sso_user_from_header();
    IF _sso_user.is_valid THEN
      _user_email_to_use := _sso_user.user_email;
    ELSE
      -- Se não encontrou usuário SSO, retornar erro
      RAISE EXCEPTION 'User not authenticated via SSO. Provide p_user_email or valid SSO token in header.';
    END IF;
  END IF;
  
  -- Obter filtro WHERE usando função auxiliar (mesma lógica que RLS)
  -- Esta é a fonte única de verdade compartilhada com RLS policies
  _where_filter := public.get_acordos_where_filter(
    p_user_id => NULL,
    p_user_email => _user_email_to_use
  );
  
  -- Se filtro é FALSE, usuário não tem acesso
  IF _where_filter = 'FALSE' THEN
    -- Retornar vazio (sem acordos)
    RETURN;
  END IF;
  
  -- Executar query com filtro WHERE usando função auxiliar
  -- Esta query retorna os mesmos resultados que uma query via RLS com Supabase Auth
  RETURN QUERY
  EXECUTE format('
    SELECT 
      a.id,
      a.anexo_url,
      a.atualizado_em,
      a.cliente_id,
      a.comprador_id,
      a.criado_em,
      a.data_negociacao,
      a.detalhes_acordo,
      a.formato_abatimento,
      a.justificativa,
      a.mes_previsto_abatimento,
      a.numero_acordo,
      a.regional,
      a.status::TEXT,
      a.tipo::TEXT,
      a.tipo_acordo_id,
      a.uf,
      a.valor,
      a.vendedor_id,
      a.organizacao_slug,
      a.tenant_id
    FROM public.acordos a
    WHERE (%s)
    ORDER BY a.criado_em DESC
  ', _where_filter);
  
END;
$$;

-- ==============================================
-- FUNÇÃO RPC SSO PARA BUSCAR ACORDO POR ID
-- ==============================================

-- Função auxiliar para buscar um acordo específico via SSO

CREATE OR REPLACE FUNCTION public.get_acordo_sso(
  p_acordo_id UUID,
  p_user_email TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  anexo_url TEXT,
  atualizado_em TIMESTAMPTZ,
  cliente_id UUID,
  comprador_id UUID,
  criado_em TIMESTAMPTZ,
  data_negociacao DATE,
  detalhes_acordo TEXT,
  formato_abatimento TEXT,
  justificativa TEXT,
  mes_previsto_abatimento TEXT,
  numero_acordo TEXT,
  regional TEXT,
  status TEXT,
  tipo TEXT,
  tipo_acordo_id UUID,
  uf TEXT,
  valor NUMERIC,
  vendedor_id UUID,
  organizacao_slug TEXT,
  tenant_id UUID
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sso_user RECORD;
  _user_email_to_use TEXT;
  _can_view BOOLEAN;
BEGIN
  -- Obter email do usuário (mesmo processo que get_acordos_sso)
  IF p_user_email IS NOT NULL AND p_user_email != '' THEN
    _user_email_to_use := p_user_email;
  ELSE
    SELECT * INTO _sso_user FROM public.get_sso_user_from_header();
    IF _sso_user.is_valid THEN
      _user_email_to_use := _sso_user.user_email;
    ELSE
      RAISE EXCEPTION 'User not authenticated via SSO. Provide p_user_email or valid SSO token in header.';
    END IF;
  END IF;
  
  -- Verificar se usuário pode ver este acordo específico
  SELECT public.can_user_view_acordo(
    p_user_id => NULL,
    p_user_email => _user_email_to_use,
    p_acordo_id => p_acordo_id
  ) INTO _can_view;
  
  -- Se não pode ver, retornar vazio
  IF NOT _can_view THEN
    RETURN;
  END IF;
  
  -- Retornar acordo se usuário tem permissão
  RETURN QUERY
  SELECT 
    a.id,
    a.anexo_url,
    a.atualizado_em,
    a.cliente_id,
    a.comprador_id,
    a.criado_em,
    a.data_negociacao,
    a.detalhes_acordo,
    a.formato_abatimento,
    a.justificativa,
    a.mes_previsto_abatimento,
    a.numero_acordo,
    a.regional,
    a.status::TEXT,
    a.tipo::TEXT,
    a.tipo_acordo_id,
    a.uf,
    a.valor,
    a.vendedor_id,
    a.organizacao_slug,
    a.tenant_id
  FROM public.acordos a
  WHERE a.id = p_acordo_id
  LIMIT 1;
END;
$$;

-- ==============================================
-- PERMISSÕES
-- ==============================================

-- Permitir acesso anônimo (o token SSO valida a autenticação)
GRANT EXECUTE ON FUNCTION public.get_acordos_sso(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_acordos_sso(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_acordo_sso(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_acordo_sso(UUID, TEXT) TO authenticated;

-- ==============================================
-- ATUALIZAR MAPEAMENTOS NA TABELA DE SINCRONIZAÇÃO
-- ==============================================

-- Atualizar status de validação dos mapeamentos agora que RPC foi criada

DO $$
DECLARE
  _mapping RECORD;
BEGIN
  FOR _mapping IN 
    SELECT id FROM public.rls_rpc_mapping 
    WHERE table_name = 'acordos' 
      AND rpc_function_name = 'get_acordos_sso'
  LOOP
    PERFORM public.validate_rls_rpc_mapping(_mapping.id);
  END LOOP;
END $$;

-- ==============================================
-- COMENTÁRIOS
-- ==============================================

COMMENT ON FUNCTION public.get_acordos_sso(TEXT) IS 
'Função RPC SSO para buscar acordos. Usa mesma lógica das RLS policies através de funções auxiliares.
Esta é a fonte única de verdade para SSO, compartilhada com RLS.
Retorna acordos filtrados baseado no papel do usuário (admin, gestor, vendedor, etc.).
Deve ser usada apenas quando login é via SSO. Para Supabase Auth, usar queries diretas (RLS aplica filtros automaticamente).';

COMMENT ON FUNCTION public.get_acordo_sso(UUID, TEXT) IS 
'Função RPC SSO para buscar um acordo específico por ID. 
Verifica permissão usando função auxiliar can_user_view_acordo().
Retorna acordo apenas se usuário tem permissão para visualizar.';
