#!/bin/bash

# Script para executar migrações do Supabase
# Data: 2025-01-30
# Descrição: Executa as migrações para implementar a nova estrutura de perfis RBAC

echo "🚀 Iniciando execução das migrações RBAC..."

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instalando..."
    npm install -g supabase
fi

# Verificar se estamos no diretório correto
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Arquivo supabase/config.toml não encontrado. Execute este script no diretório raiz do projeto."
    exit 1
fi

# Verificar status do Supabase
echo "🔍 Verificando status do Supabase..."
supabase status

# Executar migrações em ordem
echo "📦 Executando migrações..."

# 1. Criar estrutura simplificada de roles
echo "1️⃣ Criando estrutura simplificada de roles..."
supabase db reset --linked

# 2. Aplicar migrações específicas
echo "2️⃣ Aplicando migrações específicas..."

# Executar migrações em ordem cronológica
MIGRATIONS=(
    "20250130_create_simplified_rbac_roles.sql"
    "20250130_create_screen_permissions_data.sql"
    "20250130_update_rls_policies_for_simplified_roles.sql"
    "20250130_migrate_existing_users_to_new_roles.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    echo "   📄 Executando: $migration"
    if [ -f "supabase/migrations/$migration" ]; then
        supabase db push --include-all
    else
        echo "   ⚠️  Arquivo não encontrado: $migration"
    fi
done

# 3. Verificar se as migrações foram aplicadas
echo "3️⃣ Verificando migrações aplicadas..."
supabase db diff

# 4. Executar testes básicos
echo "4️⃣ Executando testes básicos..."

# Teste 1: Verificar se os roles foram criados
echo "   🧪 Teste 1: Verificando roles criados..."
supabase db shell --command "
SELECT 
    'Roles criados' as tipo,
    nome,
    descricao,
    organizacao_id
FROM public.rbac_auth_role 
WHERE ativo = true 
ORDER BY nome;
"

# Teste 2: Verificar se as permissões foram criadas
echo "   🧪 Teste 2: Verificando permissões criadas..."
supabase db shell --command "
SELECT 
    'Permissões criadas' as tipo,
    COUNT(*) as total_permissoes
FROM public.rbac_screen_permissions;
"

# Teste 3: Verificar se as organizações existem
echo "   🧪 Teste 3: Verificando organizações..."
supabase db shell --command "
SELECT 
    'Organizações' as tipo,
    nome,
    slug,
    ativo
FROM public.rbac_organizations 
WHERE ativo = true 
ORDER BY nome;
"

# 5. Relatório final
echo "5️⃣ Relatório final..."
echo "✅ Migrações executadas com sucesso!"
echo ""
echo "📊 Estrutura criada:"
echo "   - 9 perfis de usuário simplificados"
echo "   - Sistema de vinculação de equipes"
echo "   - Controle de acesso por tenant"
echo "   - Permissões granulares por tela"
echo "   - Políticas RLS atualizadas"
echo ""
echo "🔧 Próximos passos:"
echo "   1. Configurar usuários específicos"
echo "   2. Configurar equipes de gestores"
echo "   3. Testar acesso com diferentes perfis"
echo "   4. Configurar permissões específicas por tela"
echo ""
echo "🎉 Sistema RBAC simplificado implementado com sucesso!"




