-- Migration: Update RLS Policies for Simplified Roles
-- Data: 2025-01-30
-- Descrição: Atualiza políticas RLS para nova estrutura simplificada de roles

-- ==============================================
-- ATUALIZAR FUNÇÕES DE VERIFICAÇÃO DE ROLES
-- ==============================================

-- Função unificada para verificar papel do usuário (atualizada)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid DEFAULT auth.uid())
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

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(_user_id) = 'admin';
$$;

-- Função para verificar se é gestor (inclui gestor_fornecedor)
CREATE OR REPLACE FUNCTION public.is_gestor(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(_user_id) IN ('admin', 'gestor', 'gestor_fornecedor');
$$;

-- Função para verificar se é usuário (inclui usuario_fornecedor)
CREATE OR REPLACE FUNCTION public.is_usuario(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(_user_id) IN ('usuario', 'usuario_fornecedor');
$$;

-- Função para verificar se é visualizador (inclui visualizador_fornecedor)
CREATE OR REPLACE FUNCTION public.is_visualizador(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(_user_id) IN ('visualizador', 'visualizador_fornecedor');
$$;

-- Função para verificar se é teste (inclui teste_fornecedor)
CREATE OR REPLACE FUNCTION public.is_teste(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(_user_id) IN ('teste', 'teste_fornecedor');
$$;

-- Função para verificar se é fornecedor
CREATE OR REPLACE FUNCTION public.is_fornecedor(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(_user_id) IN ('gestor_fornecedor', 'usuario_fornecedor', 'visualizador_fornecedor', 'teste_fornecedor');
$$;

-- Função para verificar se pode aprovar
CREATE OR REPLACE FUNCTION public.can_approve(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(_user_id) IN ('admin', 'gestor', 'gestor_fornecedor', 'teste', 'teste_fornecedor');
$$;

-- Função para verificar se pode deletar
CREATE OR REPLACE FUNCTION public.can_delete(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(_user_id) IN ('admin', 'gestor', 'gestor_fornecedor');
$$;

-- ==============================================
-- FUNÇÕES PARA VERIFICAÇÃO DE ACESSO A TENANTS
-- ==============================================

-- Função para verificar se usuário tem acesso a um tenant específico
CREATE OR REPLACE FUNCTION public.user_has_tenant_access(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Admin tem acesso a todos os tenants
  SELECT CASE 
    WHEN public.is_admin(_user_id) THEN true
    -- Verificar se tem acesso específico ao tenant
    WHEN EXISTS (
      SELECT 1 FROM public.rbac_user_tenant_access uta
      WHERE uta.user_id = _user_id 
        AND uta.tenant_id = _tenant_id 
        AND uta.ativo = true
    ) THEN true
    -- Se é fornecedor, só tem acesso ao seu próprio tenant
    WHEN public.is_fornecedor(_user_id) THEN (
      SELECT EXISTS (
        SELECT 1 FROM public.rbac_auth_profile ap
        WHERE ap.user_id = _user_id 
          AND ap.organizacao_id = _tenant_id
      )
    )
    -- Usuários do Grupo Arruda podem ter acesso configurável
    ELSE EXISTS (
      SELECT 1 FROM public.rbac_user_tenant_access uta
      WHERE uta.user_id = _user_id 
        AND uta.tenant_id = _tenant_id 
        AND uta.ativo = true
    )
  END;
$$;

-- Função para obter organizações que o usuário pode acessar
CREATE OR REPLACE FUNCTION public.get_user_accessible_tenants(_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(tenant_id uuid, tenant_name text, tenant_slug text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Admin tem acesso a todos os tenants
  SELECT o.id, o.nome, o.slug
  FROM public.rbac_organizations o
  WHERE o.ativo = true
    AND (public.is_admin(_user_id) OR public.user_has_tenant_access(_user_id, o.id))
  ORDER BY o.nome;
$$;

-- ==============================================
-- FUNÇÕES PARA VERIFICAÇÃO DE PERMISSÕES DE TELA
-- ==============================================

-- Função para verificar se usuário tem permissão em uma tela específica
CREATE OR REPLACE FUNCTION public.user_has_screen_permission(
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
CREATE OR REPLACE FUNCTION public.get_user_screen_permissions(_user_id uuid DEFAULT auth.uid())
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
-- FUNÇÕES PARA VERIFICAÇÃO DE EQUIPE
-- ==============================================

-- Função para verificar se usuário é gestor de outro usuário
CREATE OR REPLACE FUNCTION public.is_user_manager(_manager_id uuid, _user_id uuid)
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

-- Função para obter usuários gerenciados por um gestor
CREATE OR REPLACE FUNCTION public.get_managed_users(_manager_id uuid)
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
-- ATUALIZAR POLÍTICAS RLS EXISTENTES
-- ==============================================

-- Atualizar políticas para auth_profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.rbac_auth_profile;
CREATE POLICY "Users can view their own profile" 
ON public.rbac_auth_profile 
FOR SELECT 
USING (
  is_admin() OR 
  user_id = auth.uid() OR
  (is_gestor() AND is_user_manager(auth.uid(), user_id))
);

-- Atualizar políticas para auth_role
DROP POLICY IF EXISTS "Users can view roles" ON public.rbac_auth_role;
CREATE POLICY "Users can view roles" 
ON public.rbac_auth_role 
FOR SELECT 
USING (
  is_admin() OR 
  (is_gestor() AND organizacao_id IN (SELECT tenant_id FROM public.get_user_accessible_tenants()))
);

-- ==============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==============================================

COMMENT ON FUNCTION public.get_user_role(uuid) IS 'Retorna o papel principal do usuário baseado na nova hierarquia simplificada';
COMMENT ON FUNCTION public.is_admin(uuid) IS 'Verifica se o usuário é administrador';
COMMENT ON FUNCTION public.is_gestor(uuid) IS 'Verifica se o usuário é gestor (admin, gestor, gestor_fornecedor)';
COMMENT ON FUNCTION public.is_usuario(uuid) IS 'Verifica se o usuário é usuário (usuario, usuario_fornecedor)';
COMMENT ON FUNCTION public.is_visualizador(uuid) IS 'Verifica se o usuário é visualizador (visualizador, visualizador_fornecedor)';
COMMENT ON FUNCTION public.is_teste(uuid) IS 'Verifica se o usuário é teste (teste, teste_fornecedor)';
COMMENT ON FUNCTION public.is_fornecedor(uuid) IS 'Verifica se o usuário é fornecedor';
COMMENT ON FUNCTION public.can_approve(uuid) IS 'Verifica se o usuário pode aprovar registros';
COMMENT ON FUNCTION public.can_delete(uuid) IS 'Verifica se o usuário pode deletar registros';
COMMENT ON FUNCTION public.user_has_tenant_access(uuid, uuid) IS 'Verifica se usuário tem acesso a um tenant específico';
COMMENT ON FUNCTION public.get_user_accessible_tenants(uuid) IS 'Retorna todos os tenants que o usuário pode acessar';
COMMENT ON FUNCTION public.user_has_screen_permission(uuid, text, text, text) IS 'Verifica se usuário tem permissão específica em uma tela';
COMMENT ON FUNCTION public.get_user_screen_permissions(uuid) IS 'Retorna todas as permissões de tela do usuário';
COMMENT ON FUNCTION public.is_user_manager(uuid, uuid) IS 'Verifica se um usuário é gestor de outro usuário';
COMMENT ON FUNCTION public.get_managed_users(uuid) IS 'Retorna usuários gerenciados por um gestor';
