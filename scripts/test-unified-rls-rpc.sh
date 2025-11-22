#!/bin/bash

# Script para testar o Sistema Unificado RLS-RPC
# Data: 2025-02-06
# Descrição: Executa testes para validar o sistema unificado RLS-RPC

echo "🧪 Testando Sistema Unificado RLS-RPC..."
echo ""

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
if ! supabase status | grep -q "API URL"; then
    echo "❌ Supabase não está rodando. Execute: supabase start"
    exit 1
fi

echo "✅ Supabase está rodando"
echo ""

# Executar script SQL de testes
echo "📋 Executando testes SQL..."
echo "----------------------------------------"

# Executar o script SQL e capturar output
supabase db shell --file scripts/test_unified_rls_rpc.sql 2>&1 | \
    grep -E "(NOTICE|ERROR|🧪|✅|❌|⚠️|📊)" || \
    echo "⚠️  Nenhum resultado encontrado. Verifique os logs acima."

echo ""
echo "✅ Testes concluídos!"
echo ""
echo "💡 Dica: Para ver todos os detalhes, execute:"
echo "   supabase db shell --file scripts/test_unified_rls_rpc.sql"
echo ""

