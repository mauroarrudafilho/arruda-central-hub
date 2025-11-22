-- Migration: Create Acordos Permission Functions
-- Data: 2025-02-06
-- Descrição: Cria funções específicas de permissão para a tabela acordos
-- Estas funções encapsulam toda a lógica de permissão e são usadas por RLS policies e RPC functions

-- ==============================================
-- FUNÇÃO PARA OBTER FILTRO WHERE PARA ACORDOS
-- ==============================================

-- Esta função retorna um filtro WHERE SQL reutilizável baseado no usuário
-- Usada tanto por RLS policies quanto por RPC functions
-- É a fonte única de verdade para a lógica de filtragem de acordos

CREATE OR REPLACE FUNCTION public.get_acordos_where_filter(
  p_user_id UUID DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_data RECORD;
  _role TEXT;
BEGIN
  -- Obter dados do usuário usando função unificada
  SELECT * INTO _user_data
  FROM public.get_user_data_unified(p_user_id, p_user_email)
  LIMIT 1;
  
  -- Se não encontrou usuário, sem acesso
  IF NOT FOUND THEN
    RETURN 'FALSE';
  END IF;
  
  -- Verificar se usuário está ativo
  IF NOT _user_data.ativo THEN
    RETURN 'FALSE';
  END IF;
  
  _role := _user_data.papel;
  
  -- Construir filtro WHERE baseado no papel do usuário
  -- Esta é a mesma lógica que estava nas RLS policies antigas
  RETURN CASE _role
    WHEN 'admin' THEN 
      'TRUE' -- Admin vê todos os acordos
    
    WHEN 'gestor_fornecedor' THEN 
      'TRUE' -- Gestor fornecedor vê todos os acordos
    
    WHEN 'financeiro_fornecedor' THEN 
      'status IN (''validacao'', ''assinado'', ''conciliado'')' -- Financeiro vê apenas acordos em estados específicos
    
    WHEN 'vendedor' THEN 
      format('vendedor_id = %L', _user_data.id) -- Vendedor vê apenas seus próprios acordos
    
    WHEN 'gestor' THEN 
      -- Gestor vê acordos da sua organização
      -- Verificar se usuário pertence à organização via organizacao_id
      CASE 
        WHEN _user_data.organizacao_id IS NOT NULL THEN
          format('organizacao_slug IN (
            SELECT o.slug 
            FROM rbac_organizations o
            WHERE o.id = %L 
              AND o.ativo = true
          ) OR tenant_id = %L', _user_data.organizacao_id, _user_data.organizacao_id)
        ELSE
          -- Fallback: verificar via distribuidor se organizacao_id não disponível
          CASE 
            WHEN _user_data.distribuidor IS NOT NULL THEN
              format('distribuidor = %L', _user_data.distribuidor)
            ELSE
              'FALSE'
          END
      END
    
    ELSE 
      'FALSE' -- Sem acesso para outros papéis
  END;
END;
$$;

-- ==============================================
-- FUNÇÃO PARA VERIFICAR SE USUÁRIO PODE VER ACORDO
-- ==============================================

CREATE OR REPLACE FUNCTION public.can_user_view_acordo(
  p_user_id UUID DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL,
  p_acordo_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_data RECORD;
  _role TEXT;
  _filter_result BOOLEAN;
BEGIN
  -- Obter dados do usuário
  SELECT * INTO _user_data
  FROM public.get_user_data_unified(p_user_id, p_user_email)
  LIMIT 1;
  
  -- Se não encontrou usuário ou está inativo
  IF NOT FOUND OR NOT _user_data.ativo THEN
    RETURN FALSE;
  END IF;
  
  _role := _user_data.papel;
  
  -- Se foi fornecido acordo específico, verificar diretamente
  IF p_acordo_id IS NOT NULL THEN
    -- Usar get_acordos_where_filter para obter filtro e aplicar ao acordo específico
    EXECUTE format(
      'SELECT COUNT(*) > 0 FROM acordos WHERE id = %L AND (%s)',
      p_acordo_id,
      public.get_acordos_where_filter(p_user_id, p_user_email)
    ) INTO _filter_result;
    
    RETURN _filter_result;
  END IF;
  
  -- Para verificação genérica (sem acordo específico), retornar baseado no papel
  RETURN CASE _role
    WHEN 'admin' THEN TRUE
    WHEN 'gestor_fornecedor' THEN TRUE
    WHEN 'financeiro_fornecedor' THEN TRUE
    WHEN 'vendedor' THEN TRUE
    WHEN 'gestor' THEN TRUE
    ELSE FALSE
  END;
END;
$$;

-- ==============================================
-- FUNÇÃO PARA VERIFICAR SE USUÁRIO PODE EDITAR ACORDO
-- ==============================================

CREATE OR REPLACE FUNCTION public.can_user_edit_acordo(
  p_user_id UUID DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL,
  p_acordo_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_data RECORD;
  _role TEXT;
  _acordo_status TEXT;
BEGIN
  -- Obter dados do usuário
  SELECT * INTO _user_data
  FROM public.get_user_data_unified(p_user_id, p_user_email)
  LIMIT 1;
  
  -- Se não encontrou usuário ou está inativo
  IF NOT FOUND OR NOT _user_data.ativo THEN
    RETURN FALSE;
  END IF;
  
  _role := _user_data.papel;
  
  -- Verificar permissão baseado no papel
  CASE _role
    WHEN 'admin' THEN
      RETURN TRUE; -- Admin pode editar tudo
    
    WHEN 'gestor_fornecedor' THEN
      RETURN TRUE; -- Gestor fornecedor pode editar tudo
    
    WHEN 'financeiro_fornecedor' THEN
      -- Financeiro só pode editar acordos em validação
      IF p_acordo_id IS NOT NULL THEN
        SELECT status INTO _acordo_status
        FROM acordos
        WHERE id = p_acordo_id;
        
        RETURN _acordo_status = 'validacao';
      END IF;
      -- Se não especificado, retornar TRUE (verificação será feita na policy)
      RETURN TRUE;
    
    WHEN 'vendedor' THEN
      -- Vendedor só pode editar seus próprios acordos
      IF p_acordo_id IS NOT NULL THEN
        RETURN EXISTS (
          SELECT 1 FROM acordos
          WHERE id = p_acordo_id
            AND vendedor_id = _user_data.id
        );
      END IF;
      RETURN TRUE;
    
    WHEN 'gestor' THEN
      -- Gestor pode editar acordos da sua organização
      IF p_acordo_id IS NOT NULL AND _user_data.organizacao_id IS NOT NULL THEN
        RETURN EXISTS (
          SELECT 1 FROM acordos a
          WHERE a.id = p_acordo_id
            AND (
              a.organizacao_slug IN (
                SELECT o.slug FROM rbac_organizations o
                WHERE o.id = _user_data.organizacao_id
              )
              OR a.tenant_id = _user_data.organizacao_id
            )
        );
      END IF;
      RETURN TRUE;
    
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

-- ==============================================
-- FUNÇÃO PARA VERIFICAR SE USUÁRIO PODE CRIAR ACORDO
-- ==============================================

CREATE OR REPLACE FUNCTION public.can_user_create_acordo(
  p_user_id UUID DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_data RECORD;
  _role TEXT;
BEGIN
  -- Obter dados do usuário
  SELECT * INTO _user_data
  FROM public.get_user_data_unified(p_user_id, p_user_email)
  LIMIT 1;
  
  -- Se não encontrou usuário ou está inativo
  IF NOT FOUND OR NOT _user_data.ativo THEN
    RETURN FALSE;
  END IF;
  
  _role := _user_data.papel;
  
  -- Verificar se papel permite criar acordos
  RETURN _role IN ('admin', 'gestor_fornecedor', 'vendedor');
END;
$$;

-- ==============================================
-- FUNÇÃO PARA VERIFICAR SE USUÁRIO PODE DELETAR ACORDO
-- ==============================================

CREATE OR REPLACE FUNCTION public.can_user_delete_acordo(
  p_user_id UUID DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL,
  p_acordo_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_data RECORD;
  _role TEXT;
BEGIN
  -- Obter dados do usuário
  SELECT * INTO _user_data
  FROM public.get_user_data_unified(p_user_id, p_user_email)
  LIMIT 1;
  
  -- Se não encontrou usuário ou está inativo
  IF NOT FOUND OR NOT _user_data.ativo THEN
    RETURN FALSE;
  END IF;
  
  _role := _user_data.papel;
  
  -- Verificar permissão baseado no papel
  CASE _role
    WHEN 'admin' THEN
      RETURN TRUE;
    
    WHEN 'gestor_fornecedor' THEN
      RETURN TRUE;
    
    WHEN 'vendedor' THEN
      -- Vendedor só pode deletar seus próprios acordos
      IF p_acordo_id IS NOT NULL THEN
        RETURN EXISTS (
          SELECT 1 FROM acordos
          WHERE id = p_acordo_id
            AND vendedor_id = _user_data.id
        );
      END IF;
      RETURN TRUE;
    
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

-- ==============================================
-- PERMISSÕES
-- ==============================================

GRANT EXECUTE ON FUNCTION public.get_acordos_where_filter(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_acordos_where_filter(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.can_user_view_acordo(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_view_acordo(UUID, TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.can_user_edit_acordo(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_edit_acordo(UUID, TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.can_user_create_acordo(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_create_acordo(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.can_user_delete_acordo(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_delete_acordo(UUID, TEXT, UUID) TO anon;

-- ==============================================
-- COMENTÁRIOS
-- ==============================================

COMMENT ON FUNCTION public.get_acordos_where_filter(UUID, TEXT) IS 
'Retorna filtro WHERE SQL reutilizável para acordos baseado no usuário. 
Usada por RLS policies e RPC functions. É a fonte única de verdade para lógica de filtragem.';

COMMENT ON FUNCTION public.can_user_view_acordo(UUID, TEXT, UUID) IS 
'Verifica se usuário pode visualizar um acordo específico ou acordos em geral.
Usada por RLS policies (SELECT) e validações de permissão.';

COMMENT ON FUNCTION public.can_user_edit_acordo(UUID, TEXT, UUID) IS 
'Verifica se usuário pode editar um acordo específico.
Usada por RLS policies (UPDATE) e validações de permissão.';

COMMENT ON FUNCTION public.can_user_create_acordo(UUID, TEXT) IS 
'Verifica se usuário pode criar acordos.
Usada por RLS policies (INSERT) e validações de permissão.';

COMMENT ON FUNCTION public.can_user_delete_acordo(UUID, TEXT, UUID) IS 
'Verifica se usuário pode deletar um acordo específico.
Usada por RLS policies (DELETE) e validações de permissão.';
