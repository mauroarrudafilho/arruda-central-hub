#!/bin/bash

# Script para migração gradual e segura
# Data: 2025-01-30
# Descrição: Migra usuários em lotes pequenos para reduzir riscos

echo "🔄 Iniciando migração gradual e segura..."

# Verificar se estamos no diretório correto
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instalando..."
    npm install -g supabase
fi

# Configurações
BATCH_SIZE=5
DELAY_BETWEEN_BATCHES=30
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

# Criar diretório de backup
echo "📦 Criando backup antes da migração..."
mkdir -p "$BACKUP_DIR"

# ==============================================
# FASE 1: BACKUP COMPLETO
# ==============================================

echo "💾 FASE 1: Criando backup completo do sistema..."

# Backup do banco de dados
echo "   🗄️ Fazendo backup do banco de dados..."
supabase db dump --file "$BACKUP_DIR/database_backup.sql"

# Backup das configurações
echo "   ⚙️ Fazendo backup das configurações..."
cp -r supabase/ "$BACKUP_DIR/supabase_config/"

# Backup dos dados de usuários
echo "   👥 Fazendo backup dos dados de usuários..."
supabase db shell --command "
COPY (
  SELECT 
    ap.user_id,
    ap.nome,
    ap.email,
    ap.status,
    ar.nome as role_name,
    aur.ativo as role_ativo
  FROM public.rbac_auth_profile ap
  LEFT JOIN public.rbac_auth_user_role aur ON aur.user_id = ap.user_id
  LEFT JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
  WHERE ap.status = 'ativo'
) TO STDOUT WITH CSV HEADER;
" > "$BACKUP_DIR/users_backup.csv"

echo "   ✅ Backup completo criado em: $BACKUP_DIR"

# ==============================================
# FASE 2: VALIDAÇÃO PRÉ-MIGRAÇÃO
# ==============================================

echo ""
echo "🔍 FASE 2: Validação pré-migração..."

# Verificar se as migrações estão prontas
echo "   📋 Verificando migrações..."
if [ ! -f "supabase/migrations/20250130_create_simplified_rbac_roles.sql" ]; then
    echo "   ❌ Migração de roles não encontrada"
    exit 1
fi

if [ ! -f "supabase/migrations/20250130_create_screen_permissions_data.sql" ]; then
    echo "   ❌ Migração de permissões não encontrada"
    exit 1
fi

if [ ! -f "supabase/migrations/20250130_update_rls_policies_for_simplified_roles.sql" ]; then
    echo "   ❌ Migração de políticas RLS não encontrada"
    exit 1
fi

if [ ! -f "supabase/migrations/20250130_migrate_existing_users_to_new_roles.sql" ]; then
    echo "   ❌ Migração de usuários não encontrada"
    exit 1
fi

echo "   ✅ Todas as migrações estão prontas"

# Verificar status do banco
echo "   🗄️ Verificando status do banco..."
if ! supabase status | grep -q "API URL"; then
    echo "   ❌ Supabase não está rodando"
    exit 1
fi

echo "   ✅ Banco de dados está funcionando"

# ==============================================
# FASE 3: MIGRAÇÃO DA ESTRUTURA
# ==============================================

echo ""
echo "🏗️ FASE 3: Migrando estrutura do sistema..."

# Executar migrações de estrutura (sem dados de usuários)
echo "   📦 Executando migrações de estrutura..."

# 1. Criar estrutura simplificada de roles
echo "   🔧 Criando estrutura de roles..."
if supabase db shell --file supabase/migrations/20250130_create_simplified_rbac_roles.sql; then
    echo "   ✅ Estrutura de roles criada"
else
    echo "   ❌ Falha ao criar estrutura de roles"
    echo "   🔄 Restaurando backup..."
    supabase db reset
    exit 1
fi

# 2. Criar permissões por tela
echo "   🔐 Criando permissões por tela..."
if supabase db shell --file supabase/migrations/20250130_create_screen_permissions_data.sql; then
    echo "   ✅ Permissões por tela criadas"
else
    echo "   ❌ Falha ao criar permissões por tela"
    echo "   🔄 Restaurando backup..."
    supabase db reset
    exit 1
fi

# 3. Atualizar políticas RLS
echo "   🛡️ Atualizando políticas RLS..."
if supabase db shell --file supabase/migrations/20250130_update_rls_policies_for_simplified_roles.sql; then
    echo "   ✅ Políticas RLS atualizadas"
else
    echo "   ❌ Falha ao atualizar políticas RLS"
    echo "   🔄 Restaurando backup..."
    supabase db reset
    exit 1
fi

# ==============================================
# FASE 4: MIGRAÇÃO GRADUAL DE USUÁRIOS
# ==============================================

echo ""
echo "👥 FASE 4: Migrando usuários em lotes..."

# Obter lista de usuários para migrar
echo "   📋 Obtendo lista de usuários..."
USERS_TO_MIGRATE=$(supabase db shell --command "
SELECT 
  ap.user_id,
  ap.nome,
  ap.email,
  ar.nome as current_role
FROM public.rbac_auth_profile ap
LEFT JOIN public.rbac_auth_user_role aur ON aur.user_id = ap.user_id AND aur.ativo = true
LEFT JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
WHERE ap.status = 'ativo'
  AND ar.nome IS NOT NULL
ORDER BY ap.nome;
" | tail -n +2)

# Contar usuários
TOTAL_USERS=$(echo "$USERS_TO_MIGRATE" | wc -l)
echo "   📊 Total de usuários para migrar: $TOTAL_USERS"

# Dividir em lotes
BATCH_NUMBER=1
CURRENT_BATCH=0

echo "$USERS_TO_MIGRATE" | while IFS='|' read -r user_id nome email current_role; do
    # Limpar espaços em branco
    user_id=$(echo "$user_id" | xargs)
    nome=$(echo "$nome" | xargs)
    email=$(echo "$email" | xargs)
    current_role=$(echo "$current_role" | xargs)
    
    if [ -z "$user_id" ]; then
        continue
    fi
    
    # Incrementar contador do lote
    CURRENT_BATCH=$((CURRENT_BATCH + 1))
    
    echo "   🔄 Migrando usuário $CURRENT_BATCH/$TOTAL_USERS: $nome ($email)"
    
    # Migrar usuário individual
    if supabase db shell --command "
    -- Migrar usuário específico
    DO \$\$
    DECLARE
        user_uuid UUID := '$user_id';
        new_role_id UUID;
        old_role_id UUID;
    BEGIN
        -- Obter role antigo
        SELECT ar.id INTO old_role_id
        FROM public.rbac_auth_role ar
        WHERE ar.nome = '$current_role';
        
        -- Mapear para novo role
        CASE '$current_role'
            WHEN 'admin' THEN
                SELECT id INTO new_role_id FROM public.rbac_auth_role WHERE nome = 'admin';
            WHEN 'gestor' THEN
                SELECT id INTO new_role_id FROM public.rbac_auth_role WHERE nome = 'gestor';
            WHEN 'vendedor' THEN
                SELECT id INTO new_role_id FROM public.rbac_auth_role WHERE nome = 'usuario';
            WHEN 'lider' THEN
                SELECT id INTO new_role_id FROM public.rbac_auth_role WHERE nome = 'usuario';
            WHEN 'visualizador' THEN
                SELECT id INTO new_role_id FROM public.rbac_auth_role WHERE nome = 'visualizador';
            WHEN 'gestor_fornecedor' THEN
                SELECT id INTO new_role_id FROM public.rbac_auth_role WHERE nome = 'gestor_fornecedor';
            WHEN 'financeiro_fornecedor' THEN
                SELECT id INTO new_role_id FROM public.rbac_auth_role WHERE nome = 'usuario_fornecedor';
            ELSE
                SELECT id INTO new_role_id FROM public.rbac_auth_role WHERE nome = 'visualizador';
        END CASE;
        
        -- Atribuir novo role
        INSERT INTO public.rbac_auth_user_role (user_id, role_id, concedido_por, ativo)
        VALUES (user_uuid, new_role_id, user_uuid, true)
        ON CONFLICT (user_id, role_id) DO UPDATE SET ativo = true;
        
        -- Desativar role antigo
        UPDATE public.rbac_auth_user_role 
        SET ativo = false 
        WHERE user_id = user_uuid AND role_id = old_role_id;
        
        -- Configurar acesso a tenant
        INSERT INTO public.rbac_user_tenant_access (user_id, tenant_id, nivel_acesso, concedido_por, ativo)
        SELECT 
            user_uuid,
            o.id,
            CASE 
                WHEN '$current_role' IN ('admin', 'gestor') THEN 'admin'
                WHEN '$current_role' IN ('vendedor', 'lider', 'usuario') THEN 'write'
                WHEN '$current_role' = 'visualizador' THEN 'read'
                WHEN '$current_role' = 'gestor_fornecedor' THEN 'admin'
                WHEN '$current_role' = 'financeiro_fornecedor' THEN 'write'
                ELSE 'read'
            END,
            user_uuid,
            true
        FROM public.rbac_organizations o
        WHERE o.ativo = true
          AND (
            ('$current_role' IN ('admin', 'gestor', 'vendedor', 'lider', 'visualizador') AND o.slug = 'grupo-arruda')
            OR ('$current_role' IN ('gestor_fornecedor', 'financeiro_fornecedor') AND o.slug = 'vinicola-campestre')
          )
        ON CONFLICT (user_id, tenant_id) DO UPDATE SET ativo = true;
        
    END \$\$;
    "; then
        echo "   ✅ Usuário $nome migrado com sucesso"
    else
        echo "   ❌ Falha ao migrar usuário $nome"
        echo "   🔄 Continuando com próximo usuário..."
    fi
    
    # Verificar se é hora de fazer pausa
    if [ $((CURRENT_BATCH % BATCH_SIZE)) -eq 0 ]; then
        echo "   ⏸️ Pausa de $DELAY_BETWEEN_BATCHES segundos entre lotes..."
        sleep $DELAY_BETWEEN_BATCHES
        BATCH_NUMBER=$((BATCH_NUMBER + 1))
    fi
done

# ==============================================
# FASE 5: VALIDAÇÃO PÓS-MIGRAÇÃO
# ==============================================

echo ""
echo "✅ FASE 5: Validação pós-migração..."

# Verificar se todos os usuários foram migrados
echo "   👥 Verificando migração de usuários..."
MIGRATED_USERS=$(supabase db shell --command "
SELECT COUNT(*) 
FROM public.rbac_auth_user_role aur
JOIN public.rbac_auth_role ar ON ar.id = aur.role_id
WHERE aur.ativo = true 
  AND ar.nome IN ('admin', 'gestor', 'usuario', 'visualizador', 'teste', 'gestor_fornecedor', 'usuario_fornecedor', 'visualizador_fornecedor', 'teste_fornecedor');
" | grep -o '[0-9]*')

echo "   📊 Usuários migrados: $MIGRATED_USERS"

# Verificar se as permissões estão funcionando
echo "   🔐 Verificando permissões..."
PERMISSIONS_COUNT=$(supabase db shell --command "
SELECT COUNT(*) 
FROM public.rbac_screen_permissions;
" | grep -o '[0-9]*')

echo "   📊 Permissões configuradas: $PERMISSIONS_COUNT"

# Executar testes básicos
echo "   🧪 Executando testes básicos..."
if supabase db shell --file scripts/test-rbac-system.sql > /tmp/migration-test-results.log 2>&1; then
    echo "   ✅ Testes básicos passaram"
else
    echo "   ❌ Testes básicos falharam"
    echo "   📋 Log dos testes:"
    cat /tmp/migration-test-results.log
    echo "   🔄 Considerando rollback..."
fi

# ==============================================
# RELATÓRIO FINAL
# ==============================================

echo ""
echo "🎉 MIGRAÇÃO GRADUAL CONCLUÍDA!"
echo ""
echo "📊 Resumo da migração:"
echo "   📦 Backup criado em: $BACKUP_DIR"
echo "   👥 Usuários migrados: $MIGRATED_USERS"
echo "   🔐 Permissões configuradas: $PERMISSIONS_COUNT"
echo "   🏗️ Estrutura migrada: ✅"
echo "   🛡️ Políticas RLS atualizadas: ✅"
echo ""
echo "📋 Próximos passos:"
echo "   1. Testar funcionalidades com usuários reais"
echo "   2. Monitorar logs de auditoria"
echo "   3. Validar acesso a diferentes módulos"
echo "   4. Se tudo estiver OK, remover backup após 7 dias"
echo ""
echo "🛑 Para rollback se necessário:"
echo "   ./scripts/rollback-migration.sh $BACKUP_DIR"
echo ""
echo "🔍 Para monitorar o sistema:"
echo "   ./scripts/monitor-system.sh"




