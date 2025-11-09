-- Migration: Create Screen Permissions Data
-- Data: 2025-01-30
-- Descrição: Insere permissões específicas por tela/módulo para cada role

-- ==============================================
-- INSERIR PERMISSÕES POR TELA/MÓDULO
-- ==============================================

-- Permissões para ADMIN (acesso total)
INSERT INTO public.rbac_screen_permissions (role_id, screen_name, module_name, can_view, can_create, can_edit, can_delete, can_approve)
SELECT 
  ar.id,
  screen.screen_name,
  screen.module_name,
  true, true, true, true, true
FROM public.rbac_auth_role ar
CROSS JOIN (VALUES
  ('users', 'gestao'),
  ('roles', 'gestao'),
  ('audit', 'gestao'),
  ('profile', 'gestao'),
  ('acordos', 'acordos'),
  ('fornecedores', 'acordos'),
  ('degustacao', 'degustacao'),
  ('campanhas', 'degustacao'),
  ('analytics', 'analytics'),
  ('relatorios', 'relatorios')
) AS screen(screen_name, module_name)
WHERE ar.nome = 'admin'
ON CONFLICT (role_id, screen_name, module_name) DO UPDATE SET
  can_view = true,
  can_create = true,
  can_edit = true,
  can_delete = true,
  can_approve = true,
  updated_at = now();

-- Permissões para GESTOR (pode visualizar todos os tenants, gerenciar equipe)
INSERT INTO public.rbac_screen_permissions (role_id, screen_name, module_name, can_view, can_create, can_edit, can_delete, can_approve)
SELECT 
  ar.id,
  screen.screen_name,
  screen.module_name,
  screen.can_view,
  screen.can_create,
  screen.can_edit,
  screen.can_delete,
  screen.can_approve
FROM public.rbac_auth_role ar
CROSS JOIN (VALUES
  ('users', 'gestao', true, true, true, false, true),
  ('roles', 'gestao', true, false, false, false, false),
  ('audit', 'gestao', true, false, false, false, false),
  ('profile', 'gestao', true, true, true, false, false),
  ('acordos', 'acordos', true, true, true, false, true),
  ('fornecedores', 'acordos', true, true, true, false, true),
  ('degustacao', 'degustacao', true, true, true, false, true),
  ('campanhas', 'degustacao', true, true, true, false, true),
  ('analytics', 'analytics', true, false, false, false, false),
  ('relatorios', 'relatorios', true, false, false, false, false)
) AS screen(screen_name, module_name, can_view, can_create, can_edit, can_delete, can_approve)
WHERE ar.nome = 'gestor'
ON CONFLICT (role_id, screen_name, module_name) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_create = EXCLUDED.can_create,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete,
  can_approve = EXCLUDED.can_approve,
  updated_at = now();

-- Permissões para USUÁRIO (acesso aos próprios dados, pode criar e submeter)
INSERT INTO public.rbac_screen_permissions (role_id, screen_name, module_name, can_view, can_create, can_edit, can_delete, can_approve)
SELECT 
  ar.id,
  screen.screen_name,
  screen.module_name,
  screen.can_view,
  screen.can_create,
  screen.can_edit,
  screen.can_delete,
  screen.can_approve
FROM public.rbac_auth_role ar
CROSS JOIN (VALUES
  ('users', 'gestao', false, false, false, false, false),
  ('roles', 'gestao', false, false, false, false, false),
  ('audit', 'gestao', false, false, false, false, false),
  ('profile', 'gestao', true, false, true, false, false),
  ('acordos', 'acordos', true, true, true, false, false),
  ('fornecedores', 'acordos', true, false, false, false, false),
  ('degustacao', 'degustacao', true, true, true, false, false),
  ('campanhas', 'degustacao', true, true, true, false, false),
  ('analytics', 'analytics', true, false, false, false, false),
  ('relatorios', 'relatorios', true, false, false, false, false)
) AS screen(screen_name, module_name, can_view, can_create, can_edit, can_delete, can_approve)
WHERE ar.nome = 'usuario'
ON CONFLICT (role_id, screen_name, module_name) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_create = EXCLUDED.can_create,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete,
  can_approve = EXCLUDED.can_approve,
  updated_at = now();

-- Permissões para VISUALIZADOR (apenas visualizar)
INSERT INTO public.rbac_screen_permissions (role_id, screen_name, module_name, can_view, can_create, can_edit, can_delete, can_approve)
SELECT 
  ar.id,
  screen.screen_name,
  screen.module_name,
  true, false, false, false, false
FROM public.rbac_auth_role ar
CROSS JOIN (VALUES
  ('users', 'gestao'),
  ('roles', 'gestao'),
  ('audit', 'gestao'),
  ('profile', 'gestao'),
  ('acordos', 'acordos'),
  ('fornecedores', 'acordos'),
  ('degustacao', 'degustacao'),
  ('campanhas', 'degustacao'),
  ('analytics', 'analytics'),
  ('relatorios', 'relatorios')
) AS screen(screen_name, module_name)
WHERE ar.nome = 'visualizador'
ON CONFLICT (role_id, screen_name, module_name) DO UPDATE SET
  can_view = true,
  can_create = false,
  can_edit = false,
  can_delete = false,
  can_approve = false,
  updated_at = now();

-- Permissões para TESTE (mesmo acesso do admin, exceto exclusão)
INSERT INTO public.rbac_screen_permissions (role_id, screen_name, module_name, can_view, can_create, can_edit, can_delete, can_approve)
SELECT 
  ar.id,
  screen.screen_name,
  screen.module_name,
  true, true, true, false, true
FROM public.rbac_auth_role ar
CROSS JOIN (VALUES
  ('users', 'gestao'),
  ('roles', 'gestao'),
  ('audit', 'gestao'),
  ('profile', 'gestao'),
  ('acordos', 'acordos'),
  ('fornecedores', 'acordos'),
  ('degustacao', 'degustacao'),
  ('campanhas', 'degustacao'),
  ('analytics', 'analytics'),
  ('relatorios', 'relatorios')
) AS screen(screen_name, module_name)
WHERE ar.nome = 'teste'
ON CONFLICT (role_id, screen_name, module_name) DO UPDATE SET
  can_view = true,
  can_create = true,
  can_edit = true,
  can_delete = false,
  can_approve = true,
  updated_at = now();

-- ==============================================
-- PERMISSÕES PARA FORNECEDORES
-- ==============================================

-- Permissões para GESTOR_FORNECEDOR (mesmas do gestor, mas apenas do seu tenant)
INSERT INTO public.rbac_screen_permissions (role_id, screen_name, module_name, can_view, can_create, can_edit, can_delete, can_approve)
SELECT 
  ar.id,
  screen.screen_name,
  screen.module_name,
  screen.can_view,
  screen.can_create,
  screen.can_edit,
  screen.can_delete,
  screen.can_approve
FROM public.rbac_auth_role ar
CROSS JOIN (VALUES
  ('users', 'gestao', true, true, true, false, true),
  ('roles', 'gestao', false, false, false, false, false),
  ('audit', 'gestao', true, false, false, false, false),
  ('profile', 'gestao', true, true, true, false, false),
  ('acordos', 'acordos', true, true, true, false, true),
  ('fornecedores', 'acordos', true, true, true, false, true),
  ('degustacao', 'degustacao', true, true, true, false, true),
  ('campanhas', 'degustacao', true, true, true, false, true),
  ('analytics', 'analytics', true, false, false, false, false),
  ('relatorios', 'relatorios', true, false, false, false, false)
) AS screen(screen_name, module_name, can_view, can_create, can_edit, can_delete, can_approve)
WHERE ar.nome = 'gestor_fornecedor'
ON CONFLICT (role_id, screen_name, module_name) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_create = EXCLUDED.can_create,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete,
  can_approve = EXCLUDED.can_approve,
  updated_at = now();

-- Permissões para USUÁRIO_FORNECEDOR (mesma lógica do usuário, mas apenas do seu tenant)
INSERT INTO public.rbac_screen_permissions (role_id, screen_name, module_name, can_view, can_create, can_edit, can_delete, can_approve)
SELECT 
  ar.id,
  screen.screen_name,
  screen.module_name,
  screen.can_view,
  screen.can_create,
  screen.can_edit,
  screen.can_delete,
  screen.can_approve
FROM public.rbac_auth_role ar
CROSS JOIN (VALUES
  ('users', 'gestao', false, false, false, false, false),
  ('roles', 'gestao', false, false, false, false, false),
  ('audit', 'gestao', false, false, false, false, false),
  ('profile', 'gestao', true, false, true, false, false),
  ('acordos', 'acordos', true, true, true, false, false),
  ('fornecedores', 'acordos', true, false, false, false, false),
  ('degustacao', 'degustacao', true, true, true, false, false),
  ('campanhas', 'degustacao', true, true, true, false, false),
  ('analytics', 'analytics', true, false, false, false, false),
  ('relatorios', 'relatorios', true, false, false, false, false)
) AS screen(screen_name, module_name, can_view, can_create, can_edit, can_delete, can_approve)
WHERE ar.nome = 'usuario_fornecedor'
ON CONFLICT (role_id, screen_name, module_name) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_create = EXCLUDED.can_create,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete,
  can_approve = EXCLUDED.can_approve,
  updated_at = now();

-- Permissões para VISUALIZADOR_FORNECEDOR (visualizar todo o fluxo, mas apenas do seu tenant)
INSERT INTO public.rbac_screen_permissions (role_id, screen_name, module_name, can_view, can_create, can_edit, can_delete, can_approve)
SELECT 
  ar.id,
  screen.screen_name,
  screen.module_name,
  true, false, false, false, false
FROM public.rbac_auth_role ar
CROSS JOIN (VALUES
  ('users', 'gestao'),
  ('roles', 'gestao'),
  ('audit', 'gestao'),
  ('profile', 'gestao'),
  ('acordos', 'acordos'),
  ('fornecedores', 'acordos'),
  ('degustacao', 'degustacao'),
  ('campanhas', 'degustacao'),
  ('analytics', 'analytics'),
  ('relatorios', 'relatorios')
) AS screen(screen_name, module_name)
WHERE ar.nome = 'visualizador_fornecedor'
ON CONFLICT (role_id, screen_name, module_name) DO UPDATE SET
  can_view = true,
  can_create = false,
  can_edit = false,
  can_delete = false,
  can_approve = false,
  updated_at = now();

-- Permissões para TESTE_FORNECEDOR (mesmo acesso do gestor, mas apenas do seu tenant, sem exclusão)
INSERT INTO public.rbac_screen_permissions (role_id, screen_name, module_name, can_view, can_create, can_edit, can_delete, can_approve)
SELECT 
  ar.id,
  screen.screen_name,
  screen.module_name,
  screen.can_view,
  screen.can_create,
  screen.can_edit,
  false, -- sem exclusão
  screen.can_approve
FROM public.rbac_auth_role ar
CROSS JOIN (VALUES
  ('users', 'gestao', true, true, true, true),
  ('roles', 'gestao', false, false, false, false),
  ('audit', 'gestao', true, false, false, false),
  ('profile', 'gestao', true, true, true, false),
  ('acordos', 'acordos', true, true, true, true),
  ('fornecedores', 'acordos', true, true, true, true),
  ('degustacao', 'degustacao', true, true, true, true),
  ('campanhas', 'degustacao', true, true, true, true),
  ('analytics', 'analytics', true, false, false, false),
  ('relatorios', 'relatorios', true, false, false, false)
) AS screen(screen_name, module_name, can_view, can_create, can_edit, can_delete, can_approve)
WHERE ar.nome = 'teste_fornecedor'
ON CONFLICT (role_id, screen_name, module_name) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_create = EXCLUDED.can_create,
  can_edit = EXCLUDED.can_edit,
  can_delete = false, -- sempre sem exclusão
  can_approve = EXCLUDED.can_approve,
  updated_at = now();

-- ==============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==============================================

COMMENT ON TABLE public.rbac_screen_permissions IS 'Permissões específicas por tela/módulo para cada role do sistema';
COMMENT ON COLUMN public.rbac_screen_permissions.screen_name IS 'Nome da tela/módulo (ex: users, roles, acordos)';
COMMENT ON COLUMN public.rbac_screen_permissions.module_name IS 'Nome do módulo (ex: gestao, acordos, degustacao)';
COMMENT ON COLUMN public.rbac_screen_permissions.can_view IS 'Pode visualizar a tela';
COMMENT ON COLUMN public.rbac_screen_permissions.can_create IS 'Pode criar registros na tela';
COMMENT ON COLUMN public.rbac_screen_permissions.can_edit IS 'Pode editar registros na tela';
COMMENT ON COLUMN public.rbac_screen_permissions.can_delete IS 'Pode deletar registros na tela';
COMMENT ON COLUMN public.rbac_screen_permissions.can_approve IS 'Pode aprovar registros na tela';
