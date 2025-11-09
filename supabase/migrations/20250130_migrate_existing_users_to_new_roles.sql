-- Migration: Migrate Existing Users to New Roles
-- Data: 2025-01-30
-- Descrição: Migra usuários existentes para a nova estrutura de roles simplificada

-- ==============================================
-- MIGRAR USUÁRIOS EXISTENTES PARA NOVOS ROLES
-- ==============================================

-- 1. Migrar usuários admin existentes para o novo role 'admin'
INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
    aur.user_id,
    new_role.id,
    aur.concedido_por,
    aur.ativo
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role old_role ON old_role.id = aur.role_id
JOIN public.rbac_auth_role new_role ON new_role.nome = 'admin'
WHERE old_role.nome = 'admin'
  AND aur.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.rbac_auth_user_role new_aur
    WHERE new_aur.user_id = aur.user_id 
      AND new_aur.role_id = new_role.id
      AND new_aur.ativo = true
  );

-- 2. Migrar usuários gestor existentes para o novo role 'gestor'
INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
    aur.user_id,
    new_role.id,
    aur.concedido_por,
    aur.ativo
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role old_role ON old_role.id = aur.role_id
JOIN public.rbac_auth_role new_role ON new_role.nome = 'gestor'
WHERE old_role.nome = 'gestor'
  AND aur.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.rbac_auth_user_role new_aur
    WHERE new_aur.user_id = aur.user_id 
      AND new_aur.role_id = new_role.id
      AND new_aur.ativo = true
  );

-- 3. Migrar usuários vendedor existentes para o novo role 'usuario'
INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
    aur.user_id,
    new_role.id,
    aur.concedido_por,
    aur.ativo
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role old_role ON old_role.id = aur.role_id
JOIN public.rbac_auth_role new_role ON new_role.nome = 'usuario'
WHERE old_role.nome = 'vendedor'
  AND aur.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.rbac_auth_user_role new_aur
    WHERE new_aur.user_id = aur.user_id 
      AND new_aur.role_id = new_role.id
      AND new_aur.ativo = true
  );

-- 4. Migrar usuários lider existentes para o novo role 'usuario'
INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
    aur.user_id,
    new_role.id,
    aur.concedido_por,
    aur.ativo
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role old_role ON old_role.id = aur.role_id
JOIN public.rbac_auth_role new_role ON new_role.nome = 'usuario'
WHERE old_role.nome = 'lider'
  AND aur.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.rbac_auth_user_role new_aur
    WHERE new_aur.user_id = aur.user_id 
      AND new_aur.role_id = new_role.id
      AND new_aur.ativo = true
  );

-- 5. Migrar usuários visualizador existentes para o novo role 'visualizador'
INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
    aur.user_id,
    new_role.id,
    aur.concedido_por,
    aur.ativo
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role old_role ON old_role.id = aur.role_id
JOIN public.rbac_auth_role new_role ON new_role.nome = 'visualizador'
WHERE old_role.nome = 'visualizador'
  AND aur.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.rbac_auth_user_role new_aur
    WHERE new_aur.user_id = aur.user_id 
      AND new_aur.role_id = new_role.id
      AND new_aur.ativo = true
  );

-- 6. Migrar usuários gestor_fornecedor existentes para o novo role 'gestor_fornecedor'
INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
    aur.user_id,
    new_role.id,
    aur.concedido_por,
    aur.ativo
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role old_role ON old_role.id = aur.role_id
JOIN public.rbac_auth_role new_role ON new_role.nome = 'gestor_fornecedor'
WHERE old_role.nome = 'gestor_fornecedor'
  AND aur.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.rbac_auth_user_role new_aur
    WHERE new_aur.user_id = aur.user_id 
      AND new_aur.role_id = new_role.id
      AND new_aur.ativo = true
  );

-- 7. Migrar usuários financeiro_fornecedor existentes para o novo role 'usuario_fornecedor'
INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
    aur.user_id,
    new_role.id,
    aur.concedido_por,
    aur.ativo
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role old_role ON old_role.id = aur.role_id
JOIN public.rbac_auth_role new_role ON new_role.nome = 'usuario_fornecedor'
WHERE old_role.nome = 'financeiro_fornecedor'
  AND aur.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.rbac_auth_user_role new_aur
    WHERE new_aur.user_id = aur.user_id 
      AND new_aur.role_id = new_role.id
      AND new_aur.ativo = true
  );

-- ==============================================
-- CONFIGURAR ACESSO A TENANTS PARA USUÁRIOS EXISTENTES
-- ==============================================

-- 8. Configurar acesso a todos os tenants para usuários admin
INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
SELECT 
    aur.user_id,
    o.id,
    'admin',
    aur.user_id,
    true
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
CROSS JOIN public.rbac_organizations o
WHERE ar.nome = 'admin'
  AND aur.ativo = true
  AND ar.ativo = true
  AND o.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.rbac_user_tenant_access uta
    WHERE uta.user_id = aur.user_id 
      AND uta.tenant_id = o.id
  );

-- 9. Configurar acesso a todos os tenants para usuários gestor
INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
SELECT 
    aur.user_id,
    o.id,
    'write',
    aur.user_id,
    true
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
CROSS JOIN public.rbac_organizations o
WHERE ar.nome = 'gestor'
  AND aur.ativo = true
  AND ar.ativo = true
  AND o.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.rbac_user_tenant_access uta
    WHERE uta.user_id = aur.user_id 
      AND uta.tenant_id = o.id
  );

-- 10. Configurar acesso ao Grupo Arruda para usuários usuario
INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
SELECT 
    aur.user_id,
    o.id,
    'write',
    aur.user_id,
    true
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
JOIN public.rbac_organizations o ON o.slug = 'grupo-arruda'
WHERE ar.nome = 'usuario'
  AND aur.ativo = true
  AND ar.ativo = true
  AND o.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.rbac_user_tenant_access uta
    WHERE uta.user_id = aur.user_id 
      AND uta.tenant_id = o.id
  );

-- 11. Configurar acesso ao Grupo Arruda para usuários visualizador
INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
SELECT 
    aur.user_id,
    o.id,
    'read',
    aur.user_id,
    true
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
JOIN public.rbac_organizations o ON o.slug = 'grupo-arruda'
WHERE ar.nome = 'visualizador'
  AND aur.ativo = true
  AND ar.ativo = true
  AND o.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.rbac_user_tenant_access uta
    WHERE uta.user_id = aur.user_id 
      AND uta.tenant_id = o.id
  );

-- 12. Configurar acesso à Vinícola Campestre para usuários fornecedores
INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
SELECT 
    aur.user_id,
    o.id,
    CASE 
      WHEN ar.nome = 'gestor_fornecedor' THEN 'admin'
      WHEN ar.nome = 'usuario_fornecedor' THEN 'write'
      WHEN ar.nome = 'visualizador_fornecedor' THEN 'read'
      WHEN ar.nome = 'teste_fornecedor' THEN 'admin'
      ELSE 'read'
    END,
    aur.user_id,
    true
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
JOIN public.rbac_organizations o ON o.slug = 'vinicola-campestre'
WHERE ar.nome IN ('gestor_fornecedor', 'usuario_fornecedor', 'visualizador_fornecedor', 'teste_fornecedor')
  AND aur.ativo = true
  AND ar.ativo = true
  AND o.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.rbac_user_tenant_access uta
    WHERE uta.user_id = aur.user_id 
      AND uta.tenant_id = o.id
  );

-- ==============================================
-- CONFIGURAR EQUIPES PARA GESTORES
-- ==============================================

-- 13. Configurar equipes para gestores (exemplo: vincular usuários ao gestor principal)
-- Nota: Esta é uma configuração inicial. Gestores podem gerenciar suas equipes através da interface
INSERT INTO public.rbac_team_management (gestor_id, usuario_id, organizacao_id, ativo)
SELECT 
    gestor.user_id,
    usuario.user_id,
    o.id,
    true
FROM public.rbac_auth_user_role gestor
JOIN public.rbac_auth_role gestor_role ON gestor_role.id = gestor.role_id
JOIN public.rbac_auth_user_role usuario
JOIN public.rbac_auth_role usuario_role ON usuario_role.id = usuario.role_id
JOIN public.rbac_organizations o ON o.slug = 'grupo-arruda'
WHERE gestor_role.nome = 'gestor'
  AND usuario_role.nome = 'usuario'
  AND gestor.ativo = true
  AND usuario.ativo = true
  AND gestor_role.ativo = true
  AND usuario_role.ativo = true
  AND o.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.rbac_team_management tm
    WHERE tm.gestor_id = gestor.user_id 
      AND tm.usuario_id = usuario.user_id
      AND tm.organizacao_id = o.id
  )
LIMIT 10; -- Limitar para evitar muitas vinculações automáticas

-- ==============================================
-- VERIFICAÇÃO E RELATÓRIO
-- ==============================================

-- 14. Verificar migração de usuários
SELECT 
    'Usuários migrados por role' as tipo,
    ar.nome as role_name,
    COUNT(*) as total_usuarios
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
WHERE aur.ativo = true
  AND ar.ativo = true
GROUP BY ar.nome
ORDER BY ar.nome;

-- 15. Verificar acesso a tenants
SELECT 
    'Acesso a tenants por usuário' as tipo,
    ap.nome as usuario_nome,
    o.nome as tenant_nome,
    uta.nivel_acesso
FROM public.rbac_user_tenant_access uta
JOIN public.rbac_auth_profile ap ON ap.user_id = uta.user_id
JOIN public.rbac_organizations o ON o.id = uta.tenant_id
WHERE uta.ativo = true
ORDER BY ap.nome, o.nome;

-- 16. Verificar equipes configuradas
SELECT 
    'Equipes configuradas' as tipo,
    gestor_ap.nome as gestor_nome,
    usuario_ap.nome as usuario_nome,
    o.nome as organizacao_nome
FROM public.rbac_team_management tm
JOIN public.rbac_auth_profile gestor_ap ON gestor_ap.user_id = tm.gestor_id
JOIN public.rbac_auth_profile usuario_ap ON usuario_ap.user_id = tm.usuario_id
JOIN public.rbac_organizations o ON o.id = tm.organizacao_id
WHERE tm.ativo = true
ORDER BY gestor_ap.nome, usuario_ap.nome;

-- ==============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==============================================

COMMENT ON TABLE public.rbac_team_management IS 'Vinculação de gestores às suas equipes - migração de usuários existentes';
COMMENT ON TABLE public.rbac_user_tenant_access IS 'Controle de acesso de usuários a tenants específicos - migração de usuários existentes';




