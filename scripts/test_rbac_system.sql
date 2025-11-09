-- Script de Teste para Sistema RBAC Simplificado
-- Data: 2025-01-30
-- Descrição: Testes para verificar se a nova estrutura de perfis RBAC está funcionando

-- ==============================================
-- TESTES DE VERIFICAÇÃO DA ESTRUTURA
-- ==============================================

-- Teste 1: Verificar se todos os roles foram criados
SELECT 
    'TESTE 1: Roles criados' as teste,
    nome,
    descricao,
    cor,
    sistema,
    ativo
FROM public.rbac_auth_role 
WHERE ativo = true 
ORDER BY nome;

-- Teste 2: Verificar se as organizações existem
SELECT 
    'TESTE 2: Organizações' as teste,
    nome,
    slug,
    descricao,
    ativo
FROM public.rbac_organizations 
WHERE ativo = true 
ORDER BY nome;

-- Teste 3: Verificar se as permissões por tela foram criadas
SELECT 
    'TESTE 3: Permissões por tela' as teste,
    COUNT(*) as total_permissoes,
    COUNT(DISTINCT screen_name) as telas_unicas,
    COUNT(DISTINCT module_name) as modulos_unicos
FROM public.rbac_screen_permissions;

-- Teste 4: Verificar permissões por role
SELECT 
    'TESTE 4: Permissões por role' as teste,
    ar.nome as role_name,
    COUNT(*) as total_permissoes
FROM public.rbac_screen_permissions sp
JOIN public.rbac_auth_role ar ON ar.id = sp.role_id
WHERE ar.ativo = true
GROUP BY ar.nome
ORDER BY ar.nome;

-- ==============================================
-- TESTES DE FUNÇÕES DE VERIFICAÇÃO
-- ==============================================

-- Teste 5: Verificar função get_user_role (simular com usuário admin)
SELECT 
    'TESTE 5: Função get_user_role' as teste,
    public.get_user_role() as user_role;

-- Teste 6: Verificar funções de tipo de usuário
SELECT 
    'TESTE 6: Funções de tipo' as teste,
    public.is_admin() as is_admin,
    public.is_gestor() as is_gestor,
    public.is_usuario() as is_usuario,
    public.is_visualizador() as is_visualizador,
    public.is_teste() as is_teste,
    public.is_fornecedor() as is_fornecedor;

-- Teste 7: Verificar função de permissões
SELECT 
    'TESTE 7: Função de permissões' as teste,
    public.can_approve() as can_approve,
    public.can_delete() as can_delete;

-- ==============================================
-- TESTES DE ACESSO A TENANTS
-- ==============================================

-- Teste 8: Verificar tenants acessíveis
SELECT 
    'TESTE 8: Tenants acessíveis' as teste,
    tenant_name,
    tenant_slug
FROM public.get_user_accessible_tenants();

-- Teste 9: Verificar acesso a tenant específico
SELECT 
    'TESTE 9: Acesso a tenant específico' as teste,
    public.user_has_tenant_access(
        auth.uid(), 
        (SELECT id FROM public.rbac_organizations WHERE slug = 'grupo-arruda')
    ) as has_grupo_arruda_access,
    public.user_has_tenant_access(
        auth.uid(), 
        (SELECT id FROM public.rbac_organizations WHERE slug = 'vinicola-campestre')
    ) as has_vinicola_access;

-- ==============================================
-- TESTES DE PERMISSÕES DE TELA
-- ==============================================

-- Teste 10: Verificar permissões de tela do usuário atual
SELECT 
    'TESTE 10: Permissões de tela' as teste,
    screen_name,
    module_name,
    can_view,
    can_create,
    can_edit,
    can_delete,
    can_approve
FROM public.get_user_screen_permissions()
ORDER BY module_name, screen_name;

-- Teste 11: Verificar permissão específica em tela
SELECT 
    'TESTE 11: Permissão específica' as teste,
    public.user_has_screen_permission(auth.uid(), 'users', 'gestao', 'view') as can_view_users,
    public.user_has_screen_permission(auth.uid(), 'users', 'gestao', 'create') as can_create_users,
    public.user_has_screen_permission(auth.uid(), 'users', 'gestao', 'edit') as can_edit_users,
    public.user_has_screen_permission(auth.uid(), 'users', 'gestao', 'delete') as can_delete_users,
    public.user_has_screen_permission(auth.uid(), 'users', 'gestao', 'approve') as can_approve_users;

-- ==============================================
-- TESTES DE GESTÃO DE EQUIPE
-- ==============================================

-- Teste 12: Verificar se há gestores configurados
SELECT 
    'TESTE 12: Gestores configurados' as teste,
    COUNT(*) as total_gestores
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
WHERE ar.nome IN ('gestor', 'gestor_fornecedor')
  AND aur.ativo = true
  AND ar.ativo = true;

-- Teste 13: Verificar equipes configuradas
SELECT 
    'TESTE 13: Equipes configuradas' as teste,
    COUNT(*) as total_equipes
FROM public.rbac_team_management
WHERE ativo = true;

-- Teste 14: Verificar usuários gerenciados (se houver gestor logado)
SELECT 
    'TESTE 14: Usuários gerenciados' as teste,
    user_name,
    user_email
FROM public.get_managed_users(auth.uid())
LIMIT 5;

-- ==============================================
-- TESTES DE DADOS MIGRADOS
-- ==============================================

-- Teste 15: Verificar usuários migrados
SELECT 
    'TESTE 15: Usuários migrados' as teste,
    ar.nome as role_name,
    COUNT(*) as total_usuarios
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
WHERE aur.ativo = true
  AND ar.ativo = true
GROUP BY ar.nome
ORDER BY ar.nome;

-- Teste 16: Verificar acesso a tenants configurado
SELECT 
    'TESTE 16: Acesso a tenants' as teste,
    ap.nome as usuario_nome,
    o.nome as tenant_nome,
    uta.nivel_acesso
FROM public.rbac_user_tenant_access uta
JOIN public.rbac_auth_profile ap ON ap.user_id = uta.user_id
JOIN public.rbac_organizations o ON o.id = uta.tenant_id
WHERE uta.ativo = true
ORDER BY ap.nome, o.nome
LIMIT 10;

-- ==============================================
-- TESTES DE POLÍTICAS RLS
-- ==============================================

-- Teste 17: Verificar políticas RLS aplicadas
SELECT 
    'TESTE 17: Políticas RLS' as teste,
    policyname as policy_name,
    cmd as policy_type,
    tablename as table_name
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename LIKE 'rbac_%'
ORDER BY tablename, policyname;

-- Teste 18: Verificar se RLS está habilitado nas tabelas
SELECT 
    'TESTE 18: RLS habilitado' as teste,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename LIKE 'rbac_%'
ORDER BY tablename;

-- ==============================================
-- RELATÓRIO FINAL
-- ==============================================

-- Teste 19: Resumo geral do sistema
SELECT 
    'TESTE 19: Resumo geral' as teste,
    (SELECT COUNT(*) FROM public.rbac_auth_role WHERE ativo = true) as total_roles,
    (SELECT COUNT(*) FROM public.rbac_organizations WHERE ativo = true) as total_organizations,
    (SELECT COUNT(*) FROM public.rbac_screen_permissions) as total_screen_permissions,
    (SELECT COUNT(*) FROM public.rbac_auth_user_role WHERE ativo = true) as total_user_roles,
    (SELECT COUNT(*) FROM public.rbac_user_tenant_access WHERE ativo = true) as total_tenant_access,
    (SELECT COUNT(*) FROM public.rbac_team_management WHERE ativo = true) as total_team_management;

-- ==============================================
-- COMENTÁRIOS
-- ==============================================

/*
INSTRUÇÕES PARA EXECUTAR OS TESTES:

1. Execute este script no Supabase SQL Editor
2. Verifique se todos os testes retornam resultados esperados
3. Se algum teste falhar, verifique as migrações correspondentes
4. Os testes devem ser executados com um usuário logado no sistema

RESULTADOS ESPERADOS:

- TESTE 1: Deve mostrar 9 roles (admin, gestor, usuario, visualizador, teste, gestor_fornecedor, usuario_fornecedor, visualizador_fornecedor, teste_fornecedor)
- TESTE 2: Deve mostrar 2 organizações (Grupo Arruda, Vinícola Campestre)
- TESTE 3: Deve mostrar permissões criadas para todas as telas
- TESTE 4: Deve mostrar permissões distribuídas entre os roles
- TESTE 5-7: Devem retornar valores baseados no usuário logado
- TESTE 8-9: Devem mostrar tenants acessíveis baseados no role do usuário
- TESTE 10-11: Devem mostrar permissões de tela baseadas no role do usuário
- TESTE 12-14: Devem mostrar gestores e equipes configuradas
- TESTE 15-16: Devem mostrar usuários migrados e acesso a tenants
- TESTE 17-18: Devem mostrar políticas RLS aplicadas
- TESTE 19: Deve mostrar resumo geral com contadores

Se todos os testes passarem, o sistema RBAC está funcionando corretamente!
*/




