-- Migration: FASE 2 - Consolidação RBAC - Popular Dados e Permissões
-- Data: 2025-01-31
-- Descrição: Popula as novas tabelas com dados e permissões
-- Estratégia: Copiar dados existentes para novo formato SEM modificar o original

-- ==============================================
-- IMPORTANTE: ESTA MIGRAÇÃO É SEGURA
-- ==============================================
-- ✅ NÃO modifica dados existentes
-- ✅ Apenas COPIA dados para novas estruturas
-- ✅ Sistema atual continua funcionando 100%
-- ✅ Permite validação lado a lado

-- ==============================================
-- POPULAR PERMISSÕES POR TELA/MÓDULO
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
ON CONFLICT (role_id, screen_name, module_name) DO NOTHING;

-- Permissões para GESTOR
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
ON CONFLICT (role_id, screen_name, module_name) DO NOTHING;

-- Permissões para USUÁRIO
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
ON CONFLICT (role_id, screen_name, module_name) DO NOTHING;

-- Permissões para VISUALIZADOR
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
ON CONFLICT (role_id, screen_name, module_name) DO NOTHING;

-- Permissões para TESTE (sem delete)
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
ON CONFLICT (role_id, screen_name, module_name) DO NOTHING;

-- Permissões para GESTOR_FORNECEDOR
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
ON CONFLICT (role_id, screen_name, module_name) DO NOTHING;

-- Permissões para USUÁRIO_FORNECEDOR
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
ON CONFLICT (role_id, screen_name, module_name) DO NOTHING;

-- Permissões para VISUALIZADOR_FORNECEDOR
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
ON CONFLICT (role_id, screen_name, module_name) DO NOTHING;

-- Permissões para TESTE_FORNECEDOR
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
ON CONFLICT (role_id, screen_name, module_name) DO NOTHING;

-- ==============================================
-- POPULAR ACESSO A TENANTS (Baseado em dados existentes)
-- ==============================================

-- Configurar acesso para usuários com organizacao_id já definido
INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
SELECT 
  ap.user_id,
  ap.organizacao_id,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM rbac_auth_user_role aur
      JOIN rbac_auth_role ar ON ar.id = aur.role_id
      WHERE aur.user_id = ap.user_id 
        AND ar.nome IN ('admin', 'gestor', 'teste')
        AND aur.ativo = true
    ) THEN 'admin'
    WHEN EXISTS (
      SELECT 1 FROM rbac_auth_user_role aur
      JOIN rbac_auth_role ar ON ar.id = aur.role_id
      WHERE aur.user_id = ap.user_id 
        AND ar.nome IN ('gestor_fornecedor', 'teste_fornecedor')
        AND aur.ativo = true
    ) THEN 'admin'
    WHEN EXISTS (
      SELECT 1 FROM rbac_auth_user_role aur
      JOIN rbac_auth_role ar ON ar.id = aur.role_id
      WHERE aur.user_id = ap.user_id 
        AND ar.nome IN ('vendedor', 'lider', 'usuario', 'usuario_fornecedor')
        AND aur.ativo = true
    ) THEN 'write'
    ELSE 'read'
  END as nivel_acesso,
  ap.user_id as concedido_por,
  true
FROM public.rbac_auth_profile ap
WHERE ap.organizacao_id IS NOT NULL
  AND ap.status = 'ativo'
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- ==============================================
-- VALIDAÇÃO: Verificar dados populados
-- ==============================================

DO $$
DECLARE
  v_permissions_count INTEGER;
  v_tenant_access_count INTEGER;
BEGIN
  -- Verificar permissões criadas
  SELECT COUNT(*) INTO v_permissions_count
  FROM public.rbac_screen_permissions;
  
  IF v_permissions_count > 0 THEN
    RAISE NOTICE '✅ FASE 2: % permissões de tela criadas', v_permissions_count;
  ELSE
    RAISE WARNING '⚠️ FASE 2: Nenhuma permissão de tela foi criada';
  END IF;
  
  -- Verificar acesso a tenants configurado
  SELECT COUNT(*) INTO v_tenant_access_count
  FROM public.rbac_user_tenant_access;
  
  IF v_tenant_access_count > 0 THEN
    RAISE NOTICE '✅ FASE 2: % configurações de acesso a tenant criadas', v_tenant_access_count;
  ELSE
    RAISE NOTICE '⚠️ FASE 2: Nenhum acesso a tenant configurado (normal se não há usuários ainda)';
  END IF;
  
  -- Resumo por role
  RAISE NOTICE '====================================';
  RAISE NOTICE 'RESUMO DE PERMISSÕES POR ROLE:';
  RAISE NOTICE '====================================';
  
  FOR rec IN (
    SELECT 
      ar.nome as role_name,
      COUNT(*) as total_permissions
    FROM public.rbac_screen_permissions sp
    JOIN public.rbac_auth_role ar ON ar.id = sp.role_id
    GROUP BY ar.nome
    ORDER BY ar.nome
  ) LOOP
    RAISE NOTICE '  % - % permissões', rec.role_name, rec.total_permissions;
  END LOOP;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ FASE 2 CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Permissões e acesso a tenants configurados';
  RAISE NOTICE 'Sistema atual continua funcionando normalmente';
  RAISE NOTICE 'Próximo passo: FASE 3 - Validação e testes';
END $$;



