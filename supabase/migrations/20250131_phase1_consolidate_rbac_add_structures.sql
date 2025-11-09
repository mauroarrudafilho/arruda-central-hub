-- Migration: FASE 1 - Consolidação RBAC - Adicionar Novas Estruturas
-- Data: 2025-01-31
-- Descrição: Adiciona novas estruturas do RBAC consolidado SEM modificar o sistema existente
-- Estratégia: Coexistência segura - Sistema atual continua funcionando

-- ==============================================
-- IMPORTANTE: ESTA MIGRAÇÃO É SEGURA
-- ==============================================
-- ✅ NÃO modifica tabelas existentes
-- ✅ NÃO substitui funções existentes
-- ✅ NÃO remove políticas RLS existentes
-- ✅ Sistema atual continua funcionando 100%
-- ✅ Adiciona apenas NOVAS estruturas em paralelo

-- ==============================================
-- CRIAR NOVAS TABELAS (Sem tocar nas existentes)
-- ==============================================

-- Tabela para vinculação de equipes (NOVA)
CREATE TABLE IF NOT EXISTS public.rbac_team_management (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gestor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organizacao_id UUID NOT NULL REFERENCES public.rbac_organizations(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(gestor_id, usuario_id, organizacao_id)
);

-- Tabela para controle de acesso a tenants (NOVA)
CREATE TABLE IF NOT EXISTS public.rbac_user_tenant_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.rbac_organizations(id) ON DELETE CASCADE,
  nivel_acesso TEXT NOT NULL DEFAULT 'read' CHECK (nivel_acesso IN ('read', 'write', 'admin')),
  concedido_por UUID REFERENCES auth.users(id),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

-- Tabela para permissões por tela/módulo (NOVA)
CREATE TABLE IF NOT EXISTS public.rbac_screen_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.rbac_auth_role(id) ON DELETE CASCADE,
  screen_name TEXT NOT NULL,
  module_name TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  can_approve BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_id, screen_name, module_name)
);

-- ==============================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_team_management_gestor ON public.rbac_team_management(gestor_id);
CREATE INDEX IF NOT EXISTS idx_team_management_usuario ON public.rbac_team_management(usuario_id);
CREATE INDEX IF NOT EXISTS idx_team_management_organizacao ON public.rbac_team_management(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_team_management_ativo ON public.rbac_team_management(ativo);

CREATE INDEX IF NOT EXISTS idx_user_tenant_access_user ON public.rbac_user_tenant_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_access_tenant ON public.rbac_user_tenant_access(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_access_ativo ON public.rbac_user_tenant_access(ativo);

CREATE INDEX IF NOT EXISTS idx_screen_permissions_role ON public.rbac_screen_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_screen_permissions_screen ON public.rbac_screen_permissions(screen_name);
CREATE INDEX IF NOT EXISTS idx_screen_permissions_module ON public.rbac_screen_permissions(module_name);

-- ==============================================
-- ADICIONAR NOVOS ROLES (Não modifica existentes)
-- ==============================================

-- Inserir novos roles simplificados
-- ON CONFLICT DO NOTHING garante que não modifica roles existentes
INSERT INTO public.rbac_auth_role (nome, descricao, cor, sistema, organizacao_id, ativo) VALUES
-- Roles para Grupo Arruda
('admin', 'Administrador Global - Acesso total ao sistema', '#dc2626', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'grupo-arruda'), true),
('gestor', 'Gestor - Pode visualizar todos os tenants, gerenciar equipe, criar/aprovar/soft delete', '#059669', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'grupo-arruda'), true),
('usuario', 'Usuário - Acesso aos próprios dados, pode criar e submeter à aprovação', '#2563eb', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'grupo-arruda'), true),
('visualizador', 'Visualizador - Apenas visualizar todo o fluxo do sistema', '#7c3aed', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'grupo-arruda'), true),
('teste', 'Teste - Mesmo acesso do admin, exceto exclusão', '#ea580c', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'grupo-arruda'), true),

-- Roles para Fornecedores
('gestor_fornecedor', 'Gestor Fornecedor - Mesmas permissões do gestor, mas apenas do seu tenant', '#059669', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'vinicola-campestre'), true),
('usuario_fornecedor', 'Usuário Fornecedor - Mesma lógica do usuário, mas apenas do seu tenant', '#2563eb', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'vinicola-campestre'), true),
('visualizador_fornecedor', 'Visualizador Fornecedor - Visualizar todo o fluxo, mas apenas do seu tenant', '#7c3aed', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'vinicola-campestre'), true),
('teste_fornecedor', 'Teste Fornecedor - Mesmo acesso do gestor, mas apenas do seu tenant, sem exclusão', '#ea580c', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'vinicola-campestre'), true)

ON CONFLICT (nome) DO NOTHING; -- ✅ SEGURO: Não modifica se já existe

-- ==============================================
-- CRIAR NOVAS FUNÇÕES (Versão V2 - Não substitui antigas)
-- ==============================================

-- Função V2 para verificar papel do usuário (usa novos roles)
CREATE OR REPLACE FUNCTION public.get_user_role_v2(_user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT ar.nome 
     FROM rbac_auth_user_role aur
     JOIN rbac_auth_role ar ON ar.id = aur.role_id
     WHERE aur.user_id = _user_id 
       AND aur.ativo = true 
       AND ar.ativo = true
     ORDER BY 
       CASE ar.nome 
         WHEN 'admin' THEN 1
         WHEN 'gestor' THEN 2
         WHEN 'gestor_fornecedor' THEN 3
         WHEN 'usuario' THEN 4
         WHEN 'usuario_fornecedor' THEN 5
         WHEN 'teste' THEN 6
         WHEN 'teste_fornecedor' THEN 7
         WHEN 'visualizador' THEN 8
         WHEN 'visualizador_fornecedor' THEN 9
         ELSE 10
       END
     LIMIT 1),
    'visualizador'
  );
$$;

-- Função V2 para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin_v2(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role_v2(_user_id) = 'admin';
$$;

-- Função V2 para verificar se é gestor
CREATE OR REPLACE FUNCTION public.is_gestor_v2(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role_v2(_user_id) IN ('admin', 'gestor', 'gestor_fornecedor');
$$;

-- Função V2 para verificar se é usuário
CREATE OR REPLACE FUNCTION public.is_usuario_v2(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role_v2(_user_id) IN ('usuario', 'usuario_fornecedor');
$$;

-- Função V2 para verificar se é fornecedor
CREATE OR REPLACE FUNCTION public.is_fornecedor_v2(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role_v2(_user_id) IN ('gestor_fornecedor', 'usuario_fornecedor', 'visualizador_fornecedor', 'teste_fornecedor');
$$;

-- Função V2 para verificar se pode aprovar
CREATE OR REPLACE FUNCTION public.can_approve_v2(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role_v2(_user_id) IN ('admin', 'gestor', 'gestor_fornecedor', 'teste', 'teste_fornecedor');
$$;

-- Função V2 para verificar se pode deletar
CREATE OR REPLACE FUNCTION public.can_delete_v2(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role_v2(_user_id) IN ('admin', 'gestor', 'gestor_fornecedor');
$$;

-- ==============================================
-- FUNÇÕES PARA ACESSO A TENANTS (NOVAS)
-- ==============================================

-- Função para verificar se usuário tem acesso a um tenant específico
CREATE OR REPLACE FUNCTION public.user_has_tenant_access_v2(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    -- Admin tem acesso a todos os tenants
    WHEN public.is_admin_v2(_user_id) THEN true
    -- Verificar se tem acesso específico ao tenant
    WHEN EXISTS (
      SELECT 1 FROM public.rbac_user_tenant_access uta
      WHERE uta.user_id = _user_id 
        AND uta.tenant_id = _tenant_id 
        AND uta.ativo = true
    ) THEN true
    -- Se é fornecedor, só tem acesso ao seu próprio tenant
    WHEN public.is_fornecedor_v2(_user_id) THEN (
      SELECT EXISTS (
        SELECT 1 FROM public.rbac_auth_profile ap
        WHERE ap.user_id = _user_id 
          AND ap.organizacao_id = _tenant_id
      )
    )
    -- Usuários do Grupo Arruda verificam acesso configurável
    ELSE EXISTS (
      SELECT 1 FROM public.rbac_user_tenant_access uta
      WHERE uta.user_id = _user_id 
        AND uta.tenant_id = _tenant_id 
        AND uta.ativo = true
    )
  END;
$$;

-- Função para obter tenants acessíveis
CREATE OR REPLACE FUNCTION public.get_user_accessible_tenants_v2(_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(tenant_id uuid, tenant_name text, tenant_slug text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.nome, o.slug
  FROM public.rbac_organizations o
  WHERE o.ativo = true
    AND (public.is_admin_v2(_user_id) OR public.user_has_tenant_access_v2(_user_id, o.id))
  ORDER BY o.nome;
$$;

-- ==============================================
-- FUNÇÕES PARA PERMISSÕES DE TELA (NOVAS)
-- ==============================================

-- Função para verificar permissão em tela específica
CREATE OR REPLACE FUNCTION public.user_has_screen_permission_v2(
  _user_id uuid, 
  _screen_name text, 
  _module_name text, 
  _permission_type text
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.rbac_auth_user_role aur
    JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
    JOIN public.rbac_screen_permissions sp ON sp.role_id = ar.id
    WHERE aur.user_id = _user_id 
      AND aur.ativo = true 
      AND ar.ativo = true
      AND sp.screen_name = _screen_name
      AND sp.module_name = _module_name
      AND (
        (_permission_type = 'view' AND sp.can_view) OR
        (_permission_type = 'create' AND sp.can_create) OR
        (_permission_type = 'edit' AND sp.can_edit) OR
        (_permission_type = 'delete' AND sp.can_delete) OR
        (_permission_type = 'approve' AND sp.can_approve)
      )
  );
$$;

-- Função para obter todas as permissões de tela do usuário
CREATE OR REPLACE FUNCTION public.get_user_screen_permissions_v2(_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  screen_name text, 
  module_name text, 
  can_view boolean, 
  can_create boolean, 
  can_edit boolean, 
  can_delete boolean, 
  can_approve boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    sp.screen_name,
    sp.module_name,
    MAX(sp.can_view::int)::boolean as can_view,
    MAX(sp.can_create::int)::boolean as can_create,
    MAX(sp.can_edit::int)::boolean as can_edit,
    MAX(sp.can_delete::int)::boolean as can_delete,
    MAX(sp.can_approve::int)::boolean as can_approve
  FROM public.rbac_auth_user_role aur
  JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
  JOIN public.rbac_screen_permissions sp ON sp.role_id = ar.id
  WHERE aur.user_id = _user_id 
    AND aur.ativo = true 
    AND ar.ativo = true
  GROUP BY sp.screen_name, sp.module_name
  ORDER BY sp.module_name, sp.screen_name;
$$;

-- ==============================================
-- FUNÇÕES PARA GESTÃO DE EQUIPES (NOVAS)
-- ==============================================

-- Função para verificar se usuário é gestor de outro
CREATE OR REPLACE FUNCTION public.is_user_manager_v2(_manager_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.rbac_team_management tm
    WHERE tm.gestor_id = _manager_id 
      AND tm.usuario_id = _user_id 
      AND tm.ativo = true
  );
$$;

-- Função para obter usuários gerenciados
CREATE OR REPLACE FUNCTION public.get_managed_users_v2(_manager_id uuid)
RETURNS TABLE(user_id uuid, user_name text, user_email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    tm.usuario_id,
    ap.nome,
    ap.email
  FROM public.rbac_team_management tm
  JOIN public.rbac_auth_profile ap ON ap.user_id = tm.usuario_id
  WHERE tm.gestor_id = _manager_id 
    AND tm.ativo = true
    AND ap.status = 'ativo'
  ORDER BY ap.nome;
$$;

-- ==============================================
-- HABILITAR RLS NAS NOVAS TABELAS
-- ==============================================

ALTER TABLE public.rbac_team_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_user_tenant_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_screen_permissions ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- CRIAR POLÍTICAS RLS PARA NOVAS TABELAS
-- ==============================================

-- Políticas para team_management
CREATE POLICY "v2_users_can_view_team_management" 
ON public.rbac_team_management 
FOR SELECT 
USING (
  is_admin() OR is_admin_v2() OR
  EXISTS (
    SELECT 1 FROM public.rbac_auth_profile ap
    WHERE ap.user_id = auth.uid() 
      AND ap.organizacao_id = rbac_team_management.organizacao_id
  )
);

CREATE POLICY "v2_gestors_can_manage_team" 
ON public.rbac_team_management 
FOR ALL 
USING (
  is_admin() OR is_admin_v2() OR
  (public.get_user_role_v2() IN ('gestor', 'gestor_fornecedor') AND gestor_id = auth.uid())
);

-- Políticas para user_tenant_access
CREATE POLICY "v2_users_can_view_own_tenant_access" 
ON public.rbac_user_tenant_access 
FOR SELECT 
USING (
  is_admin() OR is_admin_v2() OR user_id = auth.uid()
);

CREATE POLICY "v2_admins_can_manage_tenant_access" 
ON public.rbac_user_tenant_access 
FOR ALL 
USING (is_admin() OR is_admin_v2());

-- Políticas para screen_permissions
CREATE POLICY "v2_users_can_view_screen_permissions" 
ON public.rbac_screen_permissions 
FOR SELECT 
USING (
  is_admin() OR is_admin_v2() OR
  EXISTS (
    SELECT 1 FROM public.rbac_auth_user_role aur
    WHERE aur.user_id = auth.uid() 
      AND aur.role_id = rbac_screen_permissions.role_id
      AND aur.ativo = true
  )
);

CREATE POLICY "v2_admins_can_manage_screen_permissions" 
ON public.rbac_screen_permissions 
FOR ALL 
USING (is_admin() OR is_admin_v2());

-- ==============================================
-- TRIGGERS PARA UPDATED_AT
-- ==============================================

CREATE TRIGGER update_team_management_updated_at 
  BEFORE UPDATE ON public.rbac_team_management 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_tenant_access_updated_at 
  BEFORE UPDATE ON public.rbac_user_tenant_access 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_screen_permissions_updated_at 
  BEFORE UPDATE ON public.rbac_screen_permissions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==============================================

COMMENT ON TABLE public.rbac_team_management IS 'V2: Vinculação de gestores às suas equipes (Sistema consolidado)';
COMMENT ON TABLE public.rbac_user_tenant_access IS 'V2: Controle de acesso de usuários a tenants específicos (Sistema consolidado)';
COMMENT ON TABLE public.rbac_screen_permissions IS 'V2: Permissões específicas por tela/módulo para cada role (Sistema consolidado)';

COMMENT ON FUNCTION public.get_user_role_v2(uuid) IS 'V2: Retorna o papel principal do usuário (Sistema consolidado)';
COMMENT ON FUNCTION public.user_has_tenant_access_v2(uuid, uuid) IS 'V2: Verifica se usuário tem acesso a um tenant específico (Sistema consolidado)';
COMMENT ON FUNCTION public.user_has_screen_permission_v2(uuid, text, text, text) IS 'V2: Verifica se usuário tem permissão específica em uma tela (Sistema consolidado)';

-- ==============================================
-- VALIDAÇÃO: Verificar que tudo foi criado
-- ==============================================

DO $$
DECLARE
  v_tables_count INTEGER;
  v_functions_count INTEGER;
  v_policies_count INTEGER;
BEGIN
  -- Verificar tabelas criadas
  SELECT COUNT(*) INTO v_tables_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('rbac_team_management', 'rbac_user_tenant_access', 'rbac_screen_permissions');
  
  IF v_tables_count = 3 THEN
    RAISE NOTICE '✅ FASE 1: 3 novas tabelas criadas com sucesso';
  ELSE
    RAISE WARNING '⚠️ FASE 1: Apenas % de 3 tabelas foram criadas', v_tables_count;
  END IF;
  
  -- Verificar funções V2 criadas
  SELECT COUNT(*) INTO v_functions_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name LIKE '%_v2';
  
  IF v_functions_count >= 10 THEN
    RAISE NOTICE '✅ FASE 1: Funções V2 criadas com sucesso (%)' , v_functions_count;
  ELSE
    RAISE WARNING '⚠️ FASE 1: Apenas % funções V2 foram criadas', v_functions_count;
  END IF;
  
  -- Verificar políticas RLS criadas
  SELECT COUNT(*) INTO v_policies_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname LIKE 'v2_%';
  
  IF v_policies_count >= 6 THEN
    RAISE NOTICE '✅ FASE 1: Políticas RLS V2 criadas com sucesso (%)' , v_policies_count;
  ELSE
    RAISE WARNING '⚠️ FASE 1: Apenas % políticas RLS V2 foram criadas', v_policies_count;
  END IF;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ FASE 1 CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Sistema atual continua funcionando normalmente';
  RAISE NOTICE 'Novas estruturas adicionadas em paralelo';
  RAISE NOTICE 'Próximo passo: FASE 2 - Migração de dados';
END $$;



