-- Migration: Centralized RLS Policies System
-- Sistema centralizado que unifica as políticas dos módulos acordos e degusta-go
-- Data: 2025-01-27
-- Descrição: Implementa sistema centralizado de políticas RLS para todos os módulos

-- ==============================================
-- FUNÇÕES CENTRALIZADAS DE VERIFICAÇÃO DE PAPÉIS
-- ==============================================

-- Função unificada para verificar papel do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT ar.nome 
     FROM auth_user_role aur
     JOIN auth_role ar ON ar.id = aur.role_id
     WHERE aur.user_id = _user_id 
       AND aur.ativo = true 
       AND ar.ativo = true
     ORDER BY 
       CASE ar.nome 
         WHEN 'admin' THEN 1
         WHEN 'gestor' THEN 2
         WHEN 'gestor_fornecedor' THEN 3
         WHEN 'financeiro_fornecedor' THEN 4
         WHEN 'vendedor' THEN 5
         WHEN 'lider' THEN 6
         WHEN 'visualizador' THEN 7
         ELSE 8
       END
     LIMIT 1),
    'visualizador'
  );
$$;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(_user_id) = 'admin';
$$;

-- Função para verificar se é gestor
CREATE OR REPLACE FUNCTION public.is_gestor(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(_user_id) IN ('admin', 'gestor', 'gestor_fornecedor');
$$;

-- Função para verificar se é líder
CREATE OR REPLACE FUNCTION public.is_leader(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(_user_id) IN ('admin', 'gestor', 'lider');
$$;

-- Função para verificar papel específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(_user_id) = _role;
$$;

-- Função para obter nível de acesso
CREATE OR REPLACE FUNCTION public.get_user_access_level(_user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE public.get_user_role(_user_id)
      WHEN 'admin' THEN 'admin'
      WHEN 'gestor' THEN 'gestor'
      WHEN 'gestor_fornecedor' THEN 'gestor'
      WHEN 'financeiro_fornecedor' THEN 'gestor'
      WHEN 'vendedor' THEN 'visualizador'
      WHEN 'lider' THEN 'gestor'
      ELSE 'visualizador'
    END;
$$;

-- ==============================================
-- FUNÇÕES ESPECÍFICAS PARA MÓDULOS
-- ==============================================

-- Função específica para papel em acordos
CREATE OR REPLACE FUNCTION public.get_user_acordo_papel(_user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(_user_id);
$$;

-- Função para verificar acesso hierárquico de líder a degustadora
CREATE OR REPLACE FUNCTION public.leader_has_degustadora_access(
  _leader_id uuid,
  _degustadora_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Admins têm acesso total
  SELECT CASE 
    WHEN public.is_admin(_leader_id) THEN true
    -- Verificar se o líder tem atribuição para esta degustadora
    WHEN EXISTS (
      SELECT 1 FROM leader_assignments la
      WHERE la.leader_id = _leader_id 
        AND la.assigned_type = 'degustadora'
        AND la.assigned_id = _degustadora_id
        AND la.active = true
    ) THEN true
    ELSE false
  END;
$$;

-- Função para verificar acesso hierárquico de líder a promotor
CREATE OR REPLACE FUNCTION public.leader_has_promoter_access(
  _leader_id uuid,
  _promoter_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Admins têm acesso total
  SELECT CASE 
    WHEN public.is_admin(_leader_id) THEN true
    -- Verificar se o líder tem atribuição para este promotor
    WHEN EXISTS (
      SELECT 1 FROM leader_assignments la
      WHERE la.leader_id = _leader_id 
        AND la.assigned_type = 'promoter'
        AND la.assigned_id = _promoter_id
        AND la.active = true
    ) THEN true
    ELSE false
  END;
$$;

-- ==============================================
-- FUNÇÕES DE VERIFICAÇÃO DE PERMISSÕES
-- ==============================================

-- Função para verificar permissão específica de módulo
CREATE OR REPLACE FUNCTION public.user_has_module_permission(
  _user_id uuid,
  _module_name text,
  _action text
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth_user_role aur
    JOIN auth_role ar ON ar.id = aur.role_id
    JOIN auth_role_permission arp ON arp.role_id = ar.id
    JOIN auth_permission ap ON ap.id = arp.permission_id
    WHERE aur.user_id = _user_id
      AND aur.ativo = true
      AND ar.ativo = true
      AND arp.concedida = true
      AND ap.modulo = _module_name
      AND ap.acao = _action
  ) OR public.is_admin(_user_id);
$$;

-- Função para verificar acesso a dados específicos
CREATE OR REPLACE FUNCTION public.user_can_access_data(
  _user_id uuid,
  _module_name text,
  _data_owner_id uuid DEFAULT NULL,
  _data_distribuidor text DEFAULT NULL,
  _data_departamento text DEFAULT NULL,
  _data_status text DEFAULT NULL
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
          EXISTS (
            SELECT 1 FROM auth_profile ap 
            WHERE ap.user_id = _user_id 
            AND ap.distribuidor = _data_distribuidor
          )
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
    
    -- Verificação por distribuidor (se implementado)
    WHEN _data_distribuidor IS NOT NULL THEN 
      EXISTS (
        SELECT 1 FROM auth_profile ap 
        WHERE ap.user_id = _user_id 
        AND ap.distribuidor = _data_distribuidor
      )
    
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
-- FUNÇÕES PARA APLICAR POLÍTICAS AUTOMATICAMENTE
-- ==============================================

-- Função para aplicar políticas RLS padrão em tabelas de módulos
CREATE OR REPLACE FUNCTION public.apply_standard_module_rls_policies(
  _table_name text,
  _module_name text,
  _owner_column text DEFAULT 'criado_por',
  _distribuidor_column text DEFAULT 'distribuidor',
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
    )', _table_name, _table_name, _module_name, _owner_column, _distribuidor_column, _departamento_column, _status_column);
  
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
    )', _table_name, _table_name, _module_name, _owner_column, _distribuidor_column, _departamento_column, _status_column, _module_name);
  
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
      ) AND (
        public.user_has_module_permission(auth.uid(), %L, ''delete'') OR
        public.is_admin(auth.uid())
      )
    )', _table_name, _table_name, _module_name, _owner_column, _distribuidor_column, _departamento_column, _status_column, _module_name);
  
  RAISE NOTICE 'Standard RLS policies applied to table % for module %', _table_name, _module_name;
END;
$$;

-- Função para aplicar políticas específicas de acordos
CREATE OR REPLACE FUNCTION public.apply_acordos_rls_policies(
  _table_name text,
  _owner_column text DEFAULT 'criado_por',
  _distribuidor_column text DEFAULT 'distribuidor',
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
          EXISTS (
            SELECT 1 FROM auth_profile ap 
            WHERE ap.user_id = auth.uid() 
            AND ap.distribuidor = %I
          )
        ELSE false
      END
    )', _table_name, _status_column, _owner_column, _distribuidor_column);
  
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
          EXISTS (
            SELECT 1 FROM auth_profile ap 
            WHERE ap.user_id = auth.uid() 
            AND ap.distribuidor = %I
          )
        ELSE false
      END
    )', _table_name, _status_column, _owner_column, _distribuidor_column);
  
  -- Política de DELETE para acordos
  EXECUTE format('
    CREATE POLICY "Acordos delete by role" 
    ON public.%I 
    FOR DELETE 
    USING (
      public.get_user_role(auth.uid()) IN (''admin'', ''gestor_fornecedor'') OR
      (%I = auth.uid() AND public.get_user_role(auth.uid()) = ''vendedor'')
    )', _table_name, _owner_column);
  
  RAISE NOTICE 'Acordos RLS policies applied to table %', _table_name;
END;
$$;

-- Função para aplicar políticas específicas de degustação
CREATE OR REPLACE FUNCTION public.apply_degustacao_rls_policies(
  _table_name text,
  _owner_column text DEFAULT 'criado_por',
  _leader_column text DEFAULT 'leader_id'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Habilitar RLS na tabela
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', _table_name);
  
  -- Política de SELECT para degustação
  EXECUTE format('
    CREATE POLICY "Degustacao access by role" 
    ON public.%I 
    FOR SELECT 
    USING (
      CASE public.get_user_role(auth.uid())
        WHEN ''admin'' THEN true
        WHEN ''gestor'' THEN true
        WHEN ''lider'' THEN 
          public.leader_has_degustadora_access(auth.uid(), id) OR
          %I = auth.uid()
        WHEN ''visualizador'' THEN true
        ELSE false
      END
    )', _table_name, _leader_column);
  
  -- Política de INSERT para degustação
  EXECUTE format('
    CREATE POLICY "Degustacao create by role" 
    ON public.%I 
    FOR INSERT 
    WITH CHECK (
      public.get_user_role(auth.uid()) IN (''admin'', ''gestor'', ''lider'')
    )', _table_name);
  
  -- Política de UPDATE para degustação
  EXECUTE format('
    CREATE POLICY "Degustacao update by role" 
    ON public.%I 
    FOR UPDATE 
    USING (
      CASE public.get_user_role(auth.uid())
        WHEN ''admin'' THEN true
        WHEN ''gestor'' THEN true
        WHEN ''lider'' THEN 
          public.leader_has_degustadora_access(auth.uid(), id) OR
          %I = auth.uid()
        ELSE false
      END
    )', _table_name, _leader_column);
  
  -- Política de DELETE para degustação
  EXECUTE format('
    CREATE POLICY "Degustacao delete by role" 
    ON public.%I 
    FOR DELETE 
    USING (
      public.get_user_role(auth.uid()) IN (''admin'', ''gestor'') OR
      (public.leader_has_degustadora_access(auth.uid(), id) AND public.get_user_role(auth.uid()) = ''lider'')
    )', _table_name);
  
  RAISE NOTICE 'Degustacao RLS policies applied to table %', _table_name;
END;
$$;

-- ==============================================
-- FUNÇÕES DE UTILIDADE
-- ==============================================

-- Função para listar todas as políticas RLS aplicadas
CREATE OR REPLACE FUNCTION public.list_all_rls_policies()
RETURNS TABLE(
  table_name text,
  policy_name text,
  policy_type text,
  policy_definition text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    schemaname||'.'||tablename as table_name,
    policyname as policy_name,
    cmd as policy_type,
    COALESCE(qual, with_check) as policy_definition
  FROM pg_policies 
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;
$$;

-- Função para verificar políticas de uma tabela específica
CREATE OR REPLACE FUNCTION public.check_table_rls_policies(_table_name text)
RETURNS TABLE(
  policy_name text,
  policy_type text,
  policy_definition text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    policyname as policy_name,
    cmd as policy_type,
    COALESCE(qual, with_check) as policy_definition
  FROM pg_policies 
  WHERE schemaname = 'public'
    AND tablename = _table_name
  ORDER BY policyname;
$$;

-- ==============================================
-- PERMISSÕES ADICIONAIS
-- ==============================================

-- Inserir permissões específicas para módulos
INSERT INTO public.auth_permission (nome, modulo, acao, descricao, sistema)
VALUES
  -- Permissões para acordos
  ('module.acordos.view_all', 'acordos', 'view_all', 'Visualizar todos os acordos do sistema', true),
  ('module.acordos.create', 'acordos', 'create', 'Criar acordos comerciais', true),
  ('module.acordos.edit', 'acordos', 'edit', 'Editar acordos comerciais', true),
  ('module.acordos.delete', 'acordos', 'delete', 'Deletar acordos comerciais', true),
  ('module.acordos.approve', 'acordos', 'approve', 'Aprovar acordos comerciais', true),
  ('module.acordos.validate', 'acordos', 'validate', 'Validar acordos comerciais', true),
  
  -- Permissões para degustação
  ('module.degustacao.view_all', 'degustacao', 'view_all', 'Visualizar todas as campanhas do sistema', true),
  ('module.degustacao.create', 'degustacao', 'create', 'Criar campanhas de degustação', true),
  ('module.degustacao.edit', 'degustacao', 'edit', 'Editar campanhas de degustação', true),
  ('module.degustacao.delete', 'degustacao', 'delete', 'Deletar campanhas de degustação', true),
  ('module.degustacao.manage', 'degustacao', 'manage', 'Gerenciar degustadoras', true),
  ('module.degustacao.analytics', 'degustacao', 'analytics', 'Acessar analytics de campanhas', true)
ON CONFLICT (nome) DO NOTHING;

-- Conceder permissões para roles existentes
INSERT INTO public.auth_role_permission (role_id, permission_id, concedida)
SELECT 
  ar.id,
  ap.id,
  true
FROM public.auth_role ar
CROSS JOIN public.auth_permission ap
WHERE ar.nome IN ('admin', 'gestor', 'gestor_fornecedor', 'financeiro_fornecedor', 'vendedor', 'lider')
AND ap.modulo IN ('acordos', 'degustacao')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==============================================

COMMENT ON FUNCTION public.get_user_role(uuid) IS 'Retorna o papel principal do usuário baseado na hierarquia de roles';
COMMENT ON FUNCTION public.is_admin(uuid) IS 'Verifica se o usuário é administrador';
COMMENT ON FUNCTION public.is_gestor(uuid) IS 'Verifica se o usuário é gestor (admin, gestor, gestor_fornecedor)';
COMMENT ON FUNCTION public.is_leader(uuid) IS 'Verifica se o usuário é líder (admin, gestor, lider)';
COMMENT ON FUNCTION public.has_role(uuid, text) IS 'Verifica se o usuário tem um papel específico';
COMMENT ON FUNCTION public.get_user_access_level(uuid) IS 'Retorna o nível de acesso do usuário (admin, gestor, visualizador)';
COMMENT ON FUNCTION public.get_user_acordo_papel(uuid) IS 'Retorna o papel do usuário para módulo de acordos';
COMMENT ON FUNCTION public.leader_has_degustadora_access(uuid, uuid) IS 'Verifica se líder tem acesso a degustadora específica';
COMMENT ON FUNCTION public.leader_has_promoter_access(uuid, uuid) IS 'Verifica se líder tem acesso a promotor específico';
COMMENT ON FUNCTION public.user_has_module_permission(uuid, text, text) IS 'Verifica se usuário tem permissão específica em módulo';
COMMENT ON FUNCTION public.user_can_access_data(uuid, text, uuid, text, text, text) IS 'Verifica se usuário pode acessar dados específicos';
COMMENT ON FUNCTION public.apply_standard_module_rls_policies(text, text, text, text, text, text) IS 'Aplica políticas RLS padrão em tabelas de módulos';
COMMENT ON FUNCTION public.apply_acordos_rls_policies(text, text, text, text) IS 'Aplica políticas RLS específicas para módulo de acordos';
COMMENT ON FUNCTION public.apply_degustacao_rls_policies(text, text, text) IS 'Aplica políticas RLS específicas para módulo de degustação';
COMMENT ON FUNCTION public.list_all_rls_policies() IS 'Lista todas as políticas RLS aplicadas no sistema';
COMMENT ON FUNCTION public.check_table_rls_policies(text) IS 'Verifica políticas RLS de uma tabela específica';

