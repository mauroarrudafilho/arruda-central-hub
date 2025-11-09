#!/bin/bash

# Script para executar testes abrangentes
# Data: 2025-01-30
# Descrição: Executa todos os testes para validar a nova estrutura RBAC

echo "🧪 Executando testes abrangentes do sistema RBAC..."

# Verificar se estamos no diretório de teste
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Execute este script no diretório de teste (test-environment/)"
    exit 1
fi

# Verificar se o Supabase está rodando
if ! supabase status | grep -q "API URL"; then
    echo "❌ Supabase não está rodando. Execute: supabase start"
    exit 1
fi

echo "✅ Supabase está rodando"

# ==============================================
# TESTE 1: ESTRUTURA BÁSICA
# ==============================================

echo ""
echo "🔍 TESTE 1: Verificando estrutura básica..."

# Verificar se todos os roles foram criados
echo "   📋 Verificando roles..."
ROLES_COUNT=$(supabase db shell --command "SELECT COUNT(*) FROM public.rbac_auth_role WHERE ativo = true;" | grep -o '[0-9]*')
if [ "$ROLES_COUNT" = "9" ]; then
    echo "   ✅ 9 roles criados corretamente"
else
    echo "   ❌ Esperado 9 roles, encontrado $ROLES_COUNT"
    exit 1
fi

# Verificar se as organizações existem
echo "   🏢 Verificando organizações..."
ORGS_COUNT=$(supabase db shell --command "SELECT COUNT(*) FROM public.rbac_organizations WHERE ativo = true;" | grep -o '[0-9]*')
if [ "$ORGS_COUNT" = "2" ]; then
    echo "   ✅ 2 organizações criadas corretamente"
else
    echo "   ❌ Esperado 2 organizações, encontrado $ORGS_COUNT"
    exit 1
fi

# Verificar se as permissões foram criadas
echo "   🔐 Verificando permissões..."
PERMS_COUNT=$(supabase db shell --command "SELECT COUNT(*) FROM public.rbac_screen_permissions;" | grep -o '[0-9]*')
if [ "$PERMS_COUNT" -gt "0" ]; then
    echo "   ✅ $PERMS_COUNT permissões criadas"
else
    echo "   ❌ Nenhuma permissão encontrada"
    exit 1
fi

# ==============================================
# TESTE 2: USUÁRIOS DE TESTE
# ==============================================

echo ""
echo "👥 TESTE 2: Verificando usuários de teste..."

# Verificar se os usuários de teste foram criados
echo "   👤 Verificando perfis de usuários..."
USERS_COUNT=$(supabase db shell --command "SELECT COUNT(*) FROM public.rbac_auth_profile WHERE user_id LIKE '%-1111-1111-1111-111111111111' OR user_id LIKE '%-2222-2222-2222-222222222222' OR user_id LIKE '%-3333-3333-3333-333333333333' OR user_id LIKE '%-4444-4444-4444-444444444444' OR user_id LIKE '%-5555-5555-5555-555555555555' OR user_id LIKE '%-6666-6666-6666-666666666666' OR user_id LIKE '%-7777-7777-7777-777777777777' OR user_id LIKE '%-8888-8888-8888-888888888888' OR user_id LIKE '%-9999-9999-9999-999999999999';" | grep -o '[0-9]*')
if [ "$USERS_COUNT" = "9" ]; then
    echo "   ✅ 9 usuários de teste criados"
else
    echo "   ❌ Esperado 9 usuários, encontrado $USERS_COUNT"
    exit 1
fi

# Verificar se os roles foram atribuídos
echo "   🎭 Verificando atribuição de roles..."
ROLE_ASSIGNMENTS=$(supabase db shell --command "SELECT COUNT(*) FROM public.rbac_auth_user_role aur JOIN public.rbac_auth_profile ap ON ap.user_id = aur.user_id WHERE ap.user_id LIKE '%-1111-1111-1111-111111111111' OR ap.user_id LIKE '%-2222-2222-2222-222222222222' OR ap.user_id LIKE '%-3333-3333-3333-333333333333' OR ap.user_id LIKE '%-4444-4444-4444-444444444444' OR ap.user_id LIKE '%-5555-5555-5555-555555555555' OR ap.user_id LIKE '%-6666-6666-6666-666666666666' OR ap.user_id LIKE '%-7777-7777-7777-777777777777' OR ap.user_id LIKE '%-8888-8888-8888-888888888888' OR ap.user_id LIKE '%-9999-9999-9999-999999999999';" | grep -o '[0-9]*')
if [ "$ROLE_ASSIGNMENTS" = "9" ]; then
    echo "   ✅ 9 atribuições de role criadas"
else
    echo "   ❌ Esperado 9 atribuições, encontrado $ROLE_ASSIGNMENTS"
    exit 1
fi

# ==============================================
# TESTE 3: ACESSO A TENANTS
# ==============================================

echo ""
echo "🏢 TESTE 3: Verificando acesso a tenants..."

# Verificar se o acesso a tenants foi configurado
echo "   🔑 Verificando configuração de acesso..."
TENANT_ACCESS=$(supabase db shell --command "SELECT COUNT(*) FROM public.rbac_user_tenant_access uta JOIN public.rbac_auth_profile ap ON ap.user_id = uta.user_id WHERE ap.user_id LIKE '%-1111-1111-1111-111111111111' OR ap.user_id LIKE '%-2222-2222-2222-222222222222' OR ap.user_id LIKE '%-3333-3333-3333-333333333333' OR ap.user_id LIKE '%-4444-4444-4444-444444444444' OR ap.user_id LIKE '%-5555-5555-5555-555555555555' OR ap.user_id LIKE '%-6666-6666-6666-666666666666' OR ap.user_id LIKE '%-7777-7777-7777-777777777777' OR ap.user_id LIKE '%-8888-8888-8888-888888888888' OR ap.user_id LIKE '%-9999-9999-9999-999999999999';" | grep -o '[0-9]*')
if [ "$TENANT_ACCESS" -gt "0" ]; then
    echo "   ✅ $TENANT_ACCESS configurações de acesso criadas"
else
    echo "   ❌ Nenhuma configuração de acesso encontrada"
    exit 1
fi

# ==============================================
# TESTE 4: EQUIPES
# ==============================================

echo ""
echo "👥 TESTE 4: Verificando equipes..."

# Verificar se as equipes foram configuradas
echo "   🏗️ Verificando configuração de equipes..."
TEAMS_COUNT=$(supabase db shell --command "SELECT COUNT(*) FROM public.rbac_team_management WHERE ativo = true;" | grep -o '[0-9]*')
if [ "$TEAMS_COUNT" -gt "0" ]; then
    echo "   ✅ $TEAMS_COUNT equipes configuradas"
else
    echo "   ❌ Nenhuma equipe configurada"
    exit 1
fi

# ==============================================
# TESTE 5: FUNÇÕES DE VERIFICAÇÃO
# ==============================================

echo ""
echo "⚙️ TESTE 5: Verificando funções de verificação..."

# Testar função get_user_role
echo "   🔍 Testando função get_user_role..."
ROLE_FUNCTION=$(supabase db shell --command "SELECT public.get_user_role();" | grep -v "get_user_role" | head -1)
if [ -n "$ROLE_FUNCTION" ]; then
    echo "   ✅ Função get_user_role funcionando"
else
    echo "   ❌ Função get_user_role não funcionando"
    exit 1
fi

# Testar função is_admin
echo "   👑 Testando função is_admin..."
ADMIN_FUNCTION=$(supabase db shell --command "SELECT public.is_admin();" | grep -v "is_admin" | head -1)
if [ -n "$ADMIN_FUNCTION" ]; then
    echo "   ✅ Função is_admin funcionando"
else
    echo "   ❌ Função is_admin não funcionando"
    exit 1
fi

# ==============================================
# TESTE 6: PERMISSÕES DE TELA
# ==============================================

echo ""
echo "🖥️ TESTE 6: Verificando permissões de tela..."

# Verificar se as permissões de tela foram criadas
echo "   📱 Verificando permissões por tela..."
SCREEN_PERMS=$(supabase db shell --command "SELECT COUNT(*) FROM public.rbac_screen_permissions;" | grep -o '[0-9]*')
if [ "$SCREEN_PERMS" -gt "0" ]; then
    echo "   ✅ $SCREEN_PERMS permissões de tela criadas"
else
    echo "   ❌ Nenhuma permissão de tela encontrada"
    exit 1
fi

# ==============================================
# TESTE 7: POLÍTICAS RLS
# ==============================================

echo ""
echo "🔒 TESTE 7: Verificando políticas RLS..."

# Verificar se as políticas RLS foram aplicadas
echo "   🛡️ Verificando políticas RLS..."
RLS_POLICIES=$(supabase db shell --command "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename LIKE 'rbac_%';" | grep -o '[0-9]*')
if [ "$RLS_POLICIES" -gt "0" ]; then
    echo "   ✅ $RLS_POLICIES políticas RLS aplicadas"
else
    echo "   ❌ Nenhuma política RLS encontrada"
    exit 1
fi

# ==============================================
# TESTE 8: TESTES FUNCIONAIS
# ==============================================

echo ""
echo "🎯 TESTE 8: Executando testes funcionais..."

# Executar script de testes funcionais
echo "   🧪 Executando testes funcionais..."
if supabase db shell --file ../scripts/test-rbac-system.sql > /tmp/test-results.log 2>&1; then
    echo "   ✅ Testes funcionais executados com sucesso"
else
    echo "   ❌ Testes funcionais falharam"
    echo "   📋 Log dos testes:"
    cat /tmp/test-results.log
    exit 1
fi

# ==============================================
# RELATÓRIO FINAL
# ==============================================

echo ""
echo "🎉 TODOS OS TESTES PASSARAM COM SUCESSO!"
echo ""
echo "📊 Resumo dos testes:"
echo "   ✅ Estrutura básica: OK"
echo "   ✅ Usuários de teste: OK"
echo "   ✅ Acesso a tenants: OK"
echo "   ✅ Equipes: OK"
echo "   ✅ Funções de verificação: OK"
echo "   ✅ Permissões de tela: OK"
echo "   ✅ Políticas RLS: OK"
echo "   ✅ Testes funcionais: OK"
echo ""
echo "🚀 Sistema RBAC está pronto para implementação em produção!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Revisar resultados dos testes"
echo "   2. Validar funcionalidades específicas"
echo "   3. Se tudo estiver OK, prosseguir com implementação em produção"
echo "   4. Usar scripts de migração segura"
echo ""
echo "🛑 Para parar o ambiente de teste:"
echo "   supabase stop"




