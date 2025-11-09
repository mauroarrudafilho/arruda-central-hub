-- Script para popular dados de teste
-- Data: 2025-01-30
-- Descrição: Cria dados de teste para validar nova estrutura RBAC

-- ==============================================
-- CRIAR USUÁRIOS DE TESTE
-- ==============================================

-- Inserir usuários de teste na tabela auth.users (simulado)
-- Nota: Em ambiente real, estes usuários seriam criados via Supabase Auth

-- ==============================================
-- CRIAR PERFIS DE USUÁRIOS DE TESTE
-- ==============================================

-- Admin de teste
INSERT INTO public.rbac_auth_profile (user_id, nome, email, status, organizacao_id)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Admin Teste', 'admin@teste.com', 'ativo', 
   (SELECT id FROM public.rbac_organizations WHERE slug = 'grupo-arruda'));

-- Gestor de teste
INSERT INTO public.rbac_auth_profile (user_id, nome, email, status, organizacao_id)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'Gestor Teste', 'gestor@teste.com', 'ativo', 
   (SELECT id FROM public.rbac_organizations WHERE slug = 'grupo-arruda'));

-- Usuário de teste
INSERT INTO public.rbac_auth_profile (user_id, nome, email, status, organizacao_id)
VALUES 
  ('33333333-3333-3333-3333-333333333333', 'Usuario Teste', 'usuario@teste.com', 'ativo', 
   (SELECT id FROM public.rbac_organizations WHERE slug = 'grupo-arruda'));

-- Visualizador de teste
INSERT INTO public.rbac_auth_profile (user_id, nome, email, status, organizacao_id)
VALUES 
  ('44444444-4444-4444-4444-444444444444', 'Visualizador Teste', 'visualizador@teste.com', 'ativo', 
   (SELECT id FROM public.rbac_organizations WHERE slug = 'grupo-arruda'));

-- Teste de teste
INSERT INTO public.rbac_auth_profile (user_id, nome, email, status, organizacao_id)
VALUES 
  ('55555555-5555-5555-5555-555555555555', 'Teste Teste', 'teste@teste.com', 'ativo', 
   (SELECT id FROM public.rbac_organizations WHERE slug = 'grupo-arruda'));

-- Gestor Fornecedor de teste
INSERT INTO public.rbac_auth_profile (user_id, nome, email, status, organizacao_id)
VALUES 
  ('66666666-6666-6666-6666-666666666666', 'Gestor Fornecedor Teste', 'gestor-fornecedor@teste.com', 'ativo', 
   (SELECT id FROM public.rbac_organizations WHERE slug = 'vinicola-campestre'));

-- Usuário Fornecedor de teste
INSERT INTO public.rbac_auth_profile (user_id, nome, email, status, organizacao_id)
VALUES 
  ('77777777-7777-7777-7777-777777777777', 'Usuario Fornecedor Teste', 'usuario-fornecedor@teste.com', 'ativo', 
   (SELECT id FROM public.rbac_organizations WHERE slug = 'vinicola-campestre'));

-- Visualizador Fornecedor de teste
INSERT INTO public.rbac_auth_profile (user_id, nome, email, status, organizacao_id)
VALUES 
  ('88888888-8888-8888-8888-888888888888', 'Visualizador Fornecedor Teste', 'visualizador-fornecedor@teste.com', 'ativo', 
   (SELECT id FROM public.rbac_organizations WHERE slug = 'vinicola-campestre'));

-- Teste Fornecedor de teste
INSERT INTO public.rbac_auth_profile (user_id, nome, email, status, organizacao_id)
VALUES 
  ('99999999-9999-9999-9999-999999999999', 'Teste Fornecedor Teste', 'teste-fornecedor@teste.com', 'ativo', 
   (SELECT id FROM public.rbac_organizations WHERE slug = 'vinicola-campestre'));

-- ==============================================
-- ATRIBUIR ROLES AOS USUÁRIOS DE TESTE
-- ==============================================

-- Admin
INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
  '11111111-1111-1111-1111-111111111111',
  ar.id,
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_auth_role ar
WHERE ar.nome = 'admin';

-- Gestor
INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  ar.id,
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_auth_role ar
WHERE ar.nome = 'gestor';

-- Usuário
INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
  '33333333-3333-3333-3333-333333333333',
  ar.id,
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_auth_role ar
WHERE ar.nome = 'usuario';

-- Visualizador
INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
  '44444444-4444-4444-4444-444444444444',
  ar.id,
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_auth_role ar
WHERE ar.nome = 'visualizador';

-- Teste
INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
  '55555555-5555-5555-5555-555555555555',
  ar.id,
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_auth_role ar
WHERE ar.nome = 'teste';

-- Gestor Fornecedor
INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
  '66666666-6666-6666-6666-666666666666',
  ar.id,
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_auth_role ar
WHERE ar.nome = 'gestor_fornecedor';

-- Usuário Fornecedor
INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
  '77777777-7777-7777-7777-777777777777',
  ar.id,
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_auth_role ar
WHERE ar.nome = 'usuario_fornecedor';

-- Visualizador Fornecedor
INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
  '88888888-8888-8888-8888-888888888888',
  ar.id,
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_auth_role ar
WHERE ar.nome = 'visualizador_fornecedor';

-- Teste Fornecedor
INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
SELECT 
  '99999999-9999-9999-9999-999999999999',
  ar.id,
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_auth_role ar
WHERE ar.nome = 'teste_fornecedor';

-- ==============================================
-- CONFIGURAR ACESSO A TENANTS
-- ==============================================

-- Admin - acesso a todos os tenants
INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
SELECT 
  '11111111-1111-1111-1111-111111111111',
  o.id,
  'admin',
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_organizations o
WHERE o.ativo = true;

-- Gestor - acesso a todos os tenants
INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  o.id,
  'write',
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_organizations o
WHERE o.ativo = true;

-- Usuário - acesso ao Grupo Arruda
INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
SELECT 
  '33333333-3333-3333-3333-333333333333',
  o.id,
  'write',
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_organizations o
WHERE o.slug = 'grupo-arruda';

-- Visualizador - acesso ao Grupo Arruda
INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
SELECT 
  '44444444-4444-4444-4444-444444444444',
  o.id,
  'read',
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_organizations o
WHERE o.slug = 'grupo-arruda';

-- Teste - acesso a todos os tenants
INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
SELECT 
  '55555555-5555-5555-5555-555555555555',
  o.id,
  'admin',
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_organizations o
WHERE o.ativo = true;

-- Fornecedores - acesso apenas à Vinícola Campestre
INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
SELECT 
  '66666666-6666-6666-6666-666666666666',
  o.id,
  'admin',
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_organizations o
WHERE o.slug = 'vinicola-campestre';

INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
SELECT 
  '77777777-7777-7777-7777-777777777777',
  o.id,
  'write',
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_organizations o
WHERE o.slug = 'vinicola-campestre';

INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
SELECT 
  '88888888-8888-8888-8888-888888888888',
  o.id,
  'read',
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_organizations o
WHERE o.slug = 'vinicola-campestre';

INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
SELECT 
  '99999999-9999-9999-9999-999999999999',
  o.id,
  'admin',
  '11111111-1111-1111-1111-111111111111',
  true
FROM public.rbac_organizations o
WHERE o.slug = 'vinicola-campestre';

-- ==============================================
-- CONFIGURAR EQUIPES DE TESTE
-- ==============================================

-- Gestor gerencia usuário
INSERT INTO public.rbac_team_management (gestor_id, usuario_id, organizacao_id, ativo)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  o.id,
  true
FROM public.rbac_organizations o
WHERE o.slug = 'grupo-arruda';

-- Gestor Fornecedor gerencia usuário fornecedor
INSERT INTO public.rbac_team_management (gestor_id, usuario_id, organizacao_id, ativo)
SELECT 
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777',
  o.id,
  true
FROM public.rbac_organizations o
WHERE o.slug = 'vinicola-campestre';

-- ==============================================
-- VERIFICAÇÃO DOS DADOS CRIADOS
-- ==============================================

-- Verificar usuários criados
SELECT 
  'Usuários de teste criados' as tipo,
  ap.nome,
  ap.email,
  ar.nome as role_name
FROM public.rbac_auth_profile ap
JOIN public.rbac_auth_user_role aur ON aur.user_id = ap.user_id
JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
WHERE ap.user_id LIKE '%-1111-1111-1111-111111111111'
   OR ap.user_id LIKE '%-2222-2222-2222-222222222222'
   OR ap.user_id LIKE '%-3333-3333-3333-333333333333'
   OR ap.user_id LIKE '%-4444-4444-4444-444444444444'
   OR ap.user_id LIKE '%-5555-5555-5555-555555555555'
   OR ap.user_id LIKE '%-6666-6666-6666-666666666666'
   OR ap.user_id LIKE '%-7777-7777-7777-777777777777'
   OR ap.user_id LIKE '%-8888-8888-8888-888888888888'
   OR ap.user_id LIKE '%-9999-9999-9999-999999999999'
ORDER BY ar.nome, ap.nome;

-- Verificar acesso a tenants
SELECT 
  'Acesso a tenants configurado' as tipo,
  ap.nome as usuario_nome,
  o.nome as tenant_nome,
  uta.nivel_acesso
FROM public.rbac_user_tenant_access uta
JOIN public.rbac_auth_profile ap ON ap.user_id = uta.user_id
JOIN public.rbac_organizations o ON o.id = uta.tenant_id
WHERE ap.user_id LIKE '%-1111-1111-1111-111111111111'
   OR ap.user_id LIKE '%-2222-2222-2222-222222222222'
   OR ap.user_id LIKE '%-3333-3333-3333-333333333333'
   OR ap.user_id LIKE '%-4444-4444-4444-444444444444'
   OR ap.user_id LIKE '%-5555-5555-5555-555555555555'
   OR ap.user_id LIKE '%-6666-6666-6666-666666666666'
   OR ap.user_id LIKE '%-7777-7777-7777-777777777777'
   OR ap.user_id LIKE '%-8888-8888-8888-888888888888'
   OR ap.user_id LIKE '%-9999-9999-9999-999999999999'
ORDER BY ap.nome, o.nome;

-- Verificar equipes configuradas
SELECT 
  'Equipes de teste configuradas' as tipo,
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
-- COMENTÁRIOS
-- ==============================================

/*
DADOS DE TESTE CRIADOS:

1. Usuários de teste com todos os roles:
   - Admin: admin@teste.com
   - Gestor: gestor@teste.com
   - Usuário: usuario@teste.com
   - Visualizador: visualizador@teste.com
   - Teste: teste@teste.com
   - Gestor Fornecedor: gestor-fornecedor@teste.com
   - Usuário Fornecedor: usuario-fornecedor@teste.com
   - Visualizador Fornecedor: visualizador-fornecedor@teste.com
   - Teste Fornecedor: teste-fornecedor@teste.com

2. Acesso a tenants configurado:
   - Admin e Teste: acesso a todos os tenants
   - Gestor: acesso a todos os tenants
   - Usuário e Visualizador: acesso ao Grupo Arruda
   - Fornecedores: acesso apenas à Vinícola Campestre

3. Equipes configuradas:
   - Gestor gerencia Usuário
   - Gestor Fornecedor gerencia Usuário Fornecedor

4. Todos os usuários têm permissões de tela baseadas em seus roles

Estes dados permitem testar todas as funcionalidades do sistema RBAC.
*/




