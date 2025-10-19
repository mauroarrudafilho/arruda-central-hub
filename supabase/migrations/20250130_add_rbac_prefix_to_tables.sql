-- Migration: Add rbac_ prefix to all RBAC tables
-- Data: 2025-01-30
-- Descrição: Adiciona prefixo rbac_ a todas as tabelas do sistema RBAC para melhor organização

-- ==============================================
-- RENOMEAR TABELAS EXISTENTES
-- ==============================================

-- Renomear tabelas de autenticação e permissões
ALTER TABLE public.auth_profile RENAME TO rbac_auth_profile;
ALTER TABLE public.auth_role RENAME TO rbac_auth_role;
ALTER TABLE public.auth_permission RENAME TO rbac_auth_permission;
ALTER TABLE public.auth_role_permission RENAME TO rbac_auth_role_permission;
ALTER TABLE public.auth_user_role RENAME TO rbac_auth_user_role;
ALTER TABLE public.auth_audit RENAME TO rbac_auth_audit;

-- Renomear tabelas de organizações e projetos
ALTER TABLE public.organizations RENAME TO rbac_organizations;
ALTER TABLE public.projects RENAME TO rbac_projects;
ALTER TABLE public.project_modules RENAME TO rbac_project_modules;
ALTER TABLE public.user_project_access RENAME TO rbac_user_project_access;

-- Renomear tabelas de módulos
ALTER TABLE public.modules RENAME TO rbac_modules;
ALTER TABLE public.user_module_access RENAME TO rbac_user_module_access;
ALTER TABLE public.module_stats RENAME TO rbac_module_stats;

-- ==============================================
-- ATUALIZAR ÍNDICES
-- ==============================================

-- Renomear índices das tabelas de autenticação
ALTER INDEX idx_auth_profile_user_id RENAME TO idx_rbac_auth_profile_user_id;
ALTER INDEX idx_auth_profile_distribuidor RENAME TO idx_rbac_auth_profile_distribuidor;
ALTER INDEX idx_auth_profile_status RENAME TO idx_rbac_auth_profile_status;
ALTER INDEX idx_auth_profile_organizacao_id RENAME TO idx_rbac_auth_profile_organizacao_id;

ALTER INDEX idx_auth_role_distribuidor RENAME TO idx_rbac_auth_role_distribuidor;
ALTER INDEX idx_auth_role_ativo RENAME TO idx_rbac_auth_role_ativo;
ALTER INDEX idx_auth_role_organizacao_id RENAME TO idx_rbac_auth_role_organizacao_id;

ALTER INDEX idx_auth_user_role_user_id RENAME TO idx_rbac_auth_user_role_user_id;
ALTER INDEX idx_auth_user_role_role_id RENAME TO idx_rbac_auth_user_role_role_id;

-- Renomear índices das tabelas de organizações
ALTER INDEX idx_organizations_slug RENAME TO idx_rbac_organizations_slug;
ALTER INDEX idx_organizations_ativo RENAME TO idx_rbac_organizations_ativo;

-- Renomear índices das tabelas de projetos
ALTER INDEX idx_projects_slug RENAME TO idx_rbac_projects_slug;
ALTER INDEX idx_projects_status RENAME TO idx_rbac_projects_status;

-- Renomear índices das tabelas de módulos
ALTER INDEX idx_modules_slug RENAME TO idx_rbac_modules_slug;
ALTER INDEX idx_modules_status RENAME TO idx_rbac_modules_status;
ALTER INDEX idx_modules_organizacao_id RENAME TO idx_rbac_modules_organizacao_id;
ALTER INDEX idx_modules_categoria RENAME TO idx_rbac_modules_categoria;
ALTER INDEX idx_modules_ativo RENAME TO idx_rbac_modules_ativo;
ALTER INDEX idx_modules_ordem RENAME TO idx_rbac_modules_ordem;

ALTER INDEX idx_user_module_access_user_id RENAME TO idx_rbac_user_module_access_user_id;
ALTER INDEX idx_user_module_access_module_id RENAME TO idx_rbac_user_module_access_module_id;
ALTER INDEX idx_user_module_access_ativo RENAME TO idx_rbac_user_module_access_ativo;

ALTER INDEX idx_module_stats_module_id RENAME TO idx_rbac_module_stats_module_id;
ALTER INDEX idx_module_stats_data RENAME TO idx_rbac_module_stats_data;

-- ==============================================
-- ATUALIZAR TRIGGERS
-- ==============================================

-- Renomear triggers
ALTER TRIGGER update_auth_profile_updated_at ON rbac_auth_profile RENAME TO update_rbac_auth_profile_updated_at;
ALTER TRIGGER update_auth_role_updated_at ON rbac_auth_role RENAME TO update_rbac_auth_role_updated_at;
ALTER TRIGGER update_organizations_updated_at ON rbac_organizations RENAME TO update_rbac_organizations_updated_at;
ALTER TRIGGER update_projects_updated_at ON rbac_projects RENAME TO update_rbac_projects_updated_at;
ALTER TRIGGER update_project_modules_updated_at ON rbac_project_modules RENAME TO update_rbac_project_modules_updated_at;
ALTER TRIGGER update_modules_updated_at ON rbac_modules RENAME TO update_rbac_modules_updated_at;
ALTER TRIGGER update_user_module_access_updated_at ON rbac_user_module_access RENAME TO update_rbac_user_module_access_updated_at;

-- ==============================================
-- ATUALIZAR FUNÇÕES COM NOVOS NOMES DE TABELAS
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

-- Função para obter organização do usuário
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  id uuid,
  nome text,
  slug text,
  descricao text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.nome,
    o.slug,
    o.descricao
  FROM rbac_organizations o
  JOIN rbac_auth_profile ap ON ap.organizacao_id = o.id
  WHERE ap.user_id = _user_id;
$$;

-- Função para verificar se usuário pertence à organização
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(
  _user_id uuid,
  _organization_slug text
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM rbac_auth_profile ap
    JOIN rbac_organizations o ON o.id = ap.organizacao_id
    WHERE ap.user_id = _user_id 
    AND o.slug = _organization_slug
  );
$$;

-- Função para obter módulos do usuário
CREATE OR REPLACE FUNCTION public.get_user_modules(_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  id uuid,
  nome text,
  slug text,
  descricao text,
  icone text,
  rota text,
  url_externa text,
  status text,
  categoria text,
  ordem integer,
  nivel_acesso text,
  versao text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.id,
    m.nome,
    m.slug,
    m.descricao,
    m.icone,
    m.rota,
    m.url_externa,
    m.status,
    m.categoria,
    m.ordem,
    COALESCE(uma.nivel_acesso, 'visualizador'::text) as nivel_acesso,
    m.versao
  FROM rbac_modules m
  LEFT JOIN rbac_user_module_access uma ON uma.module_id = m.id AND uma.user_id = _user_id AND uma.ativo = true
  WHERE m.ativo = true 
    AND (
      public.is_admin(_user_id) OR 
      uma.user_id IS NOT NULL OR
      m.status = 'disponivel'
    )
  ORDER BY m.ordem, m.nome;
$$;

-- Função para verificar acesso a módulo
CREATE OR REPLACE FUNCTION public.user_has_module_access(
  _user_id uuid,
  _module_slug text
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM rbac_modules m
    LEFT JOIN rbac_user_module_access uma ON uma.module_id = m.id AND uma.user_id = _user_id AND uma.ativo = true
    WHERE m.slug = _module_slug 
    AND m.ativo = true
    AND (
      public.is_admin(_user_id) OR 
      uma.user_id IS NOT NULL OR
      m.status = 'disponivel'
    )
  );
$$;

-- Função para registrar acesso a módulo
CREATE OR REPLACE FUNCTION public.record_module_access(
  _module_slug text,
  _user_id uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _module_id uuid;
BEGIN
  -- Obter ID do módulo
  SELECT id INTO _module_id 
  FROM rbac_modules 
  WHERE slug = _module_slug AND ativo = true;
  
  IF _module_id IS NULL THEN
    RAISE EXCEPTION 'Módulo não encontrado: %', _module_slug;
  END IF;
  
  -- Inserir ou atualizar estatística do dia
  INSERT INTO rbac_module_stats (module_id, data, acessos, usuarios_unicos)
  VALUES (_module_id, CURRENT_DATE, 1, 1)
  ON CONFLICT (module_id, data) 
  DO UPDATE SET 
    acessos = rbac_module_stats.acessos + 1,
    usuarios_unicos = CASE 
      WHEN NOT EXISTS (
        SELECT 1 FROM rbac_module_stats ms2 
        WHERE ms2.module_id = _module_id 
        AND ms2.data = CURRENT_DATE 
        AND ms2.user_id = _user_id
      ) THEN rbac_module_stats.usuarios_unicos + 1
      ELSE rbac_module_stats.usuarios_unicos
    END;
END;
$$;

-- Função para obter projetos do usuário
CREATE OR REPLACE FUNCTION public.get_user_projects(_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  id uuid,
  nome text,
  descricao text,
  slug text,
  status text,
  nivel_acesso nivel_acesso
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.nome,
    p.descricao,
    p.slug,
    p.status,
    COALESCE(upa.nivel_acesso, 'admin'::nivel_acesso) as nivel_acesso
  FROM rbac_projects p
  LEFT JOIN rbac_user_project_access upa ON upa.project_id = p.id AND upa.user_id = _user_id
  WHERE p.status = 'ativo' 
    AND (
      public.is_admin(_user_id) OR 
      upa.user_id IS NOT NULL
    )
  ORDER BY p.nome;
$$;

-- Função para verificar acesso a projeto
CREATE OR REPLACE FUNCTION public.user_has_project_access(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM rbac_user_project_access
    WHERE user_id = _user_id 
      AND project_id = _project_id
  ) OR public.is_admin(_user_id);
$$;

-- ==============================================
-- ATUALIZAR POLÍTICAS RLS
-- ==============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON rbac_organizations;
DROP POLICY IF EXISTS "Admins can manage organizations" ON rbac_organizations;
DROP POLICY IF EXISTS "Users can view projects they have access to" ON rbac_projects;
DROP POLICY IF EXISTS "Admins can manage projects" ON rbac_projects;
DROP POLICY IF EXISTS "Users can view modules they have access to" ON rbac_modules;
DROP POLICY IF EXISTS "Admins can manage modules" ON rbac_modules;
DROP POLICY IF EXISTS "Users can view their own module access" ON rbac_user_module_access;
DROP POLICY IF EXISTS "Admins can manage module access" ON rbac_user_module_access;
DROP POLICY IF EXISTS "Users can view module stats for accessible modules" ON rbac_module_stats;
DROP POLICY IF EXISTS "Admins can manage module stats" ON rbac_module_stats;

-- Criar novas políticas com nomes atualizados
CREATE POLICY "Users can view organizations they belong to" 
ON rbac_organizations 
FOR SELECT 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM rbac_auth_profile ap 
    WHERE ap.user_id = auth.uid() 
    AND ap.organizacao_id = rbac_organizations.id
  )
);

CREATE POLICY "Admins can manage organizations" 
ON rbac_organizations 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view projects they have access to" 
ON rbac_projects 
FOR SELECT 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM rbac_user_project_access upa 
    WHERE upa.project_id = rbac_projects.id AND upa.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage projects" 
ON rbac_projects 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view modules they have access to" 
ON rbac_modules 
FOR SELECT 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM rbac_user_module_access uma 
    WHERE uma.module_id = rbac_modules.id 
    AND uma.user_id = auth.uid() 
    AND uma.ativo = true
  ) OR
  rbac_modules.status = 'disponivel'
);

CREATE POLICY "Admins can manage modules" 
ON rbac_modules 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view their own module access" 
ON rbac_user_module_access 
FOR SELECT 
USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can manage module access" 
ON rbac_user_module_access 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view module stats for accessible modules" 
ON rbac_module_stats 
FOR SELECT 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM rbac_user_module_access uma 
    WHERE uma.module_id = rbac_module_stats.module_id 
    AND uma.user_id = auth.uid() 
    AND uma.ativo = true
  )
);

CREATE POLICY "Admins can manage module stats" 
ON rbac_module_stats 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- ==============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==============================================

COMMENT ON TABLE rbac_auth_profile IS 'Perfis de usuários do sistema RBAC';
COMMENT ON TABLE rbac_auth_role IS 'Papéis/roles do sistema RBAC';
COMMENT ON TABLE rbac_auth_permission IS 'Permissões do sistema RBAC';
COMMENT ON TABLE rbac_auth_role_permission IS 'Relacionamento entre papéis e permissões';
COMMENT ON TABLE rbac_auth_user_role IS 'Relacionamento entre usuários e papéis';
COMMENT ON TABLE rbac_auth_audit IS 'Auditoria de ações do sistema RBAC';
COMMENT ON TABLE rbac_organizations IS 'Organizações do sistema (Grupo Arruda, Vinícola Campestre)';
COMMENT ON TABLE rbac_projects IS 'Projetos do sistema RBAC';
COMMENT ON TABLE rbac_project_modules IS 'Módulos por projeto';
COMMENT ON TABLE rbac_user_project_access IS 'Acesso de usuários aos projetos';
COMMENT ON TABLE rbac_modules IS 'Módulos/telas do sistema Arruda Hub';
COMMENT ON TABLE rbac_user_module_access IS 'Controle de acesso de usuários aos módulos';
COMMENT ON TABLE rbac_module_stats IS 'Estatísticas de uso dos módulos por dia';
