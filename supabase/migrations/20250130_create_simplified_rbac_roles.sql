-- Migration: Create Simplified RBAC Roles Structure
-- Data: 2025-01-30
-- Descrição: Cria nova estrutura simplificada de roles para o sistema RBAC

-- ==============================================
-- CRIAR NOVA ESTRUTURA DE ROLES SIMPLIFICADA
-- ==============================================

-- Inserir roles principais do sistema
INSERT INTO public.rbac_auth_role (nome, descricao, cor, sistema, organizacao_id, ativo) VALUES
-- Roles para Grupo Arruda (organização principal)
('admin', 'Administrador Global - Acesso total ao sistema', '#dc2626', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'grupo-arruda'), true),
('gestor', 'Gestor - Pode visualizar todos os tenants, gerenciar equipe, criar/aprovar/soft delete', '#059669', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'grupo-arruda'), true),
('usuario', 'Usuário - Acesso aos próprios dados, pode criar e submeter à aprovação', '#2563eb', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'grupo-arruda'), true),
('visualizador', 'Visualizador - Apenas visualizar todo o fluxo do sistema', '#7c3aed', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'grupo-arruda'), true),
('teste', 'Teste - Mesmo acesso do admin, exceto exclusão', '#ea580c', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'grupo-arruda'), true),

-- Roles para Fornecedores (Vinícola Campestre)
('gestor_fornecedor', 'Gestor Fornecedor - Mesmas permissões do gestor, mas apenas do seu tenant', '#059669', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'vinicola-campestre'), true),
('usuario_fornecedor', 'Usuário Fornecedor - Mesma lógica do usuário, mas apenas do seu tenant', '#2563eb', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'vinicola-campestre'), true),
('visualizador_fornecedor', 'Visualizador Fornecedor - Visualizar todo o fluxo, mas apenas do seu tenant', '#7c3aed', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'vinicola-campestre'), true),
('teste_fornecedor', 'Teste Fornecedor - Mesmo acesso do gestor, mas apenas do seu tenant, sem exclusão', '#ea580c', true, (SELECT id FROM public.rbac_organizations WHERE slug = 'vinicola-campestre'), true)

ON CONFLICT (nome) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  cor = EXCLUDED.cor,
  sistema = EXCLUDED.sistema,
  organizacao_id = EXCLUDED.organizacao_id,
  ativo = EXCLUDED.ativo,
  updated_at = now();

-- ==============================================
-- CRIAR TABELA DE VINCULAÇÃO DE EQUIPES
-- ==============================================

-- Tabela para vincular gestores às suas equipes
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_team_management_gestor ON public.rbac_team_management(gestor_id);
CREATE INDEX IF NOT EXISTS idx_team_management_usuario ON public.rbac_team_management(usuario_id);
CREATE INDEX IF NOT EXISTS idx_team_management_organizacao ON public.rbac_team_management(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_team_management_ativo ON public.rbac_team_management(ativo);

-- ==============================================
-- CRIAR TABELA DE ACESSO A TENANTS
-- ==============================================

-- Tabela para controlar quais tenants cada usuário pode acessar
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_tenant_access_user ON public.rbac_user_tenant_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_access_tenant ON public.rbac_user_tenant_access(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_access_ativo ON public.rbac_user_tenant_access(ativo);

-- ==============================================
-- CRIAR TABELA DE PERMISSÕES POR TELA/MÓDULO
-- ==============================================

-- Tabela para controlar acesso a telas específicas
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_screen_permissions_role ON public.rbac_screen_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_screen_permissions_screen ON public.rbac_screen_permissions(screen_name);
CREATE INDEX IF NOT EXISTS idx_screen_permissions_module ON public.rbac_screen_permissions(module_name);

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
CREATE POLICY "Users can view team management for their organization" 
ON public.rbac_team_management 
FOR SELECT 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.rbac_auth_profile ap
    WHERE ap.user_id = auth.uid() 
      AND ap.organizacao_id = rbac_team_management.organizacao_id
  )
);

CREATE POLICY "Gestors can manage their team" 
ON public.rbac_team_management 
FOR ALL 
USING (
  is_admin() OR 
  (public.get_user_role() IN ('gestor', 'gestor_fornecedor') AND gestor_id = auth.uid())
);

-- Políticas para user_tenant_access
CREATE POLICY "Users can view their own tenant access" 
ON public.rbac_user_tenant_access 
FOR SELECT 
USING (
  is_admin() OR user_id = auth.uid()
);

CREATE POLICY "Admins can manage tenant access" 
ON public.rbac_user_tenant_access 
FOR ALL 
USING (is_admin());

-- Políticas para screen_permissions
CREATE POLICY "Users can view screen permissions for their roles" 
ON public.rbac_screen_permissions 
FOR SELECT 
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.rbac_auth_user_role aur
    WHERE aur.user_id = auth.uid() 
      AND aur.role_id = rbac_screen_permissions.role_id
      AND aur.ativo = true
  )
);

CREATE POLICY "Admins can manage screen permissions" 
ON public.rbac_screen_permissions 
FOR ALL 
USING (is_admin());

-- ==============================================
-- CRIAR TRIGGERS PARA UPDATED_AT
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

COMMENT ON TABLE public.rbac_team_management IS 'Vinculação de gestores às suas equipes';
COMMENT ON TABLE public.rbac_user_tenant_access IS 'Controle de acesso de usuários a tenants específicos';
COMMENT ON TABLE public.rbac_screen_permissions IS 'Permissões específicas por tela/módulo para cada role';

COMMENT ON COLUMN public.rbac_team_management.gestor_id IS 'ID do usuário gestor';
COMMENT ON COLUMN public.rbac_team_management.usuario_id IS 'ID do usuário da equipe';
COMMENT ON COLUMN public.rbac_user_tenant_access.nivel_acesso IS 'Nível de acesso: read, write, admin';
COMMENT ON COLUMN public.rbac_screen_permissions.screen_name IS 'Nome da tela/módulo (ex: users, roles, acordos)';
COMMENT ON COLUMN public.rbac_screen_permissions.module_name IS 'Nome do módulo (ex: gestao, acordos, degustacao)';
