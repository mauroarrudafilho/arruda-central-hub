-- Migration: Update RLS Policies for Organizations
-- Data: 2025-01-30
-- Descrição: Atualiza políticas RLS para usar organizacao ao invés de distribuidor

-- ==============================================
-- ATUALIZAR FUNÇÕES RLS PARA USAR ORGANIZAÇÃO
-- ==============================================

-- Função atualizada para verificar acesso por organização
CREATE OR REPLACE FUNCTION public.user_can_access_data(
  _user_id uuid,
  _module_name text,
  _data_owner_id uuid,
  _data_organizacao_slug text,
  _data_departamento text,
  _data_status text
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    -- Admin tem acesso total
    WHEN public.is_admin(_user_id) THEN true
    
    -- Se é o dono dos dados
    WHEN _data_owner_id = _user_id THEN true
    
    -- Verificações específicas por módulo
    WHEN _module_name = 'acordos' THEN
      CASE public.get_user_role(_user_id)
        WHEN 'gestor_fornecedor' THEN true
        WHEN 'financeiro_fornecedor' THEN 
          _data_status IN ('validacao', 'assinado', 'conciliado')
        WHEN 'vendedor' THEN _data_owner_id = _user_id
        WHEN 'gestor' THEN 
          public.user_belongs_to_organization(_user_id, _data_organizacao_slug)
        ELSE false
      END
    
    WHEN _module_name = 'degustacao' THEN
      CASE public.get_user_role(_user_id)
        WHEN 'lider' THEN 
          EXISTS (
            SELECT 1 FROM leader_assignments la
            WHERE la.leader_id = _user_id 
            AND la.assigned_type IN ('degustadora', 'promoter')
            AND la.active = true
          )
        WHEN 'gestor' THEN true
        ELSE false
      END
    
    -- Verificação por organização
    WHEN _data_organizacao_slug IS NOT NULL THEN 
      public.user_belongs_to_organization(_user_id, _data_organizacao_slug)
    
    -- Verificação por departamento (se implementado)
    WHEN _data_departamento IS NOT NULL THEN 
      EXISTS (
        SELECT 1 FROM auth_profile ap 
        WHERE ap.user_id = _user_id 
        AND ap.departamento = _data_departamento
      )
    
    ELSE false
  END;
$$;

-- ==============================================
-- ATUALIZAR FUNÇÕES DE APLICAÇÃO DE POLÍTICAS
-- ==============================================

-- Função atualizada para aplicar políticas RLS padrão
CREATE OR REPLACE FUNCTION public.apply_standard_module_rls_policies(
  _table_name text,
  _module_name text,
  _owner_column text DEFAULT 'criado_por',
  _organizacao_column text DEFAULT 'organizacao_slug',
  _departamento_column text DEFAULT 'departamento',
  _status_column text DEFAULT 'status'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Habilitar RLS na tabela
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', _table_name);
  
  -- Política de SELECT
  EXECUTE format('
    CREATE POLICY "Users can view %I they have access to" 
    ON public.%I 
    FOR SELECT 
    USING (
      public.user_can_access_data(
        auth.uid(), 
        %L, 
        %I, 
        %I, 
        %I,
        %I
      )
    )', _table_name, _table_name, _module_name, _owner_column, _organizacao_column, _departamento_column, _status_column);
  
  -- Política de INSERT
  EXECUTE format('
    CREATE POLICY "Users can create %I if they have permission" 
    ON public.%I 
    FOR INSERT 
    WITH CHECK (
      public.user_has_module_permission(auth.uid(), %L, ''create'') OR
      public.is_admin(auth.uid())
    )', _table_name, _table_name, _module_name);
  
  -- Política de UPDATE
  EXECUTE format('
    CREATE POLICY "Users can update %I they have access to" 
    ON public.%I 
    FOR UPDATE 
    USING (
      public.user_can_access_data(
        auth.uid(), 
        %L, 
        %I, 
        %I, 
        %I,
        %I
      )
    )
    WITH CHECK (
      public.user_has_module_permission(auth.uid(), %L, ''edit'') OR
      public.is_admin(auth.uid())
    )', _table_name, _table_name, _module_name, _owner_column, _organizacao_column, _departamento_column, _status_column, _module_name);
  
  -- Política de DELETE
  EXECUTE format('
    CREATE POLICY "Users can delete %I they have access to" 
    ON public.%I 
    FOR DELETE 
    USING (
      public.user_can_access_data(
        auth.uid(), 
        %L, 
        %I, 
        %I, 
        %I,
        %I
      )
    )', _table_name, _table_name, _module_name, _owner_column, _organizacao_column, _departamento_column, _status_column);
END;
$$;

-- ==============================================
-- ATUALIZAR POLÍTICAS ESPECÍFICAS PARA ACORDOS
-- ==============================================

-- Função atualizada para aplicar políticas específicas de acordos
CREATE OR REPLACE FUNCTION public.apply_acordos_rls_policies(
  _table_name text,
  _owner_column text DEFAULT 'criado_por',
  _organizacao_column text DEFAULT 'organizacao_slug',
  _status_column text DEFAULT 'status'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Habilitar RLS na tabela
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', _table_name);
  
  -- Política de SELECT para acordos
  EXECUTE format('
    CREATE POLICY "Acordos access by role" 
    ON public.%I 
    FOR SELECT 
    USING (
      CASE public.get_user_role(auth.uid())
        WHEN ''admin'' THEN true
        WHEN ''gestor_fornecedor'' THEN true
        WHEN ''financeiro_fornecedor'' THEN %I IN (''validacao'', ''assinado'', ''conciliado'')
        WHEN ''vendedor'' THEN %I = auth.uid()
        WHEN ''gestor'' THEN 
          public.user_belongs_to_organization(auth.uid(), %I)
        ELSE false
      END
    )', _table_name, _status_column, _owner_column, _organizacao_column);
  
  -- Política de INSERT para acordos
  EXECUTE format('
    CREATE POLICY "Acordos create by role" 
    ON public.%I 
    FOR INSERT 
    WITH CHECK (
      public.get_user_role(auth.uid()) IN (''admin'', ''gestor_fornecedor'', ''vendedor'')
    )', _table_name);
  
  -- Política de UPDATE para acordos
  EXECUTE format('
    CREATE POLICY "Acordos update by role" 
    ON public.%I 
    FOR UPDATE 
    USING (
      CASE public.get_user_role(auth.uid())
        WHEN ''admin'' THEN true
        WHEN ''gestor_fornecedor'' THEN true
        WHEN ''financeiro_fornecedor'' THEN %I = ''validacao''
        WHEN ''vendedor'' THEN %I = auth.uid()
        WHEN ''gestor'' THEN 
          public.user_belongs_to_organization(auth.uid(), %I)
        ELSE false
      END
    )', _table_name, _status_column, _owner_column, _organizacao_column);
  
  -- Política de DELETE para acordos
  EXECUTE format('
    CREATE POLICY "Acordos delete by role" 
    ON public.%I 
    FOR DELETE 
    USING (
      CASE public.get_user_role(auth.uid())
        WHEN ''admin'' THEN true
        WHEN ''gestor_fornecedor'' THEN true
        WHEN ''vendedor'' THEN %I = auth.uid()
        WHEN ''gestor'' THEN 
          public.user_belongs_to_organization(auth.uid(), %I)
        ELSE false
      END
    )', _table_name, _owner_column, _organizacao_column);
END;
$$;

-- ==============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==============================================

COMMENT ON TABLE public.organizations IS 'Tabela de organizações do sistema (Grupo Arruda, Vinícola Campestre, etc.)';
COMMENT ON COLUMN public.organizations.slug IS 'Slug único da organização (ex: grupo-arruda, vinicola-campestre)';
COMMENT ON COLUMN public.auth_profile.organizacao_id IS 'Referência à organização do usuário';
COMMENT ON COLUMN public.auth_role.organizacao_id IS 'Referência à organização do role (null = global)';

COMMENT ON FUNCTION public.get_user_organization IS 'Retorna a organização do usuário';
COMMENT ON FUNCTION public.user_belongs_to_organization IS 'Verifica se usuário pertence à organização especificada';
