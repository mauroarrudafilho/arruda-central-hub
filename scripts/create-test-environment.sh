#!/bin/bash

# Script para criar ambiente de teste isolado
# Data: 2025-01-30
# Descrição: Cria ambiente de teste para validar nova estrutura RBAC

echo "🧪 Criando ambiente de teste isolado..."

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instalando..."
    npm install -g supabase
fi

# Criar diretório de teste
TEST_DIR="test-environment"
if [ -d "$TEST_DIR" ]; then
    echo "🗑️ Removendo ambiente de teste anterior..."
    rm -rf "$TEST_DIR"
fi

echo "📁 Criando diretório de teste..."
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Inicializar novo projeto Supabase para teste
echo "🚀 Inicializando projeto Supabase de teste..."
supabase init --with-vscode-settings

# Configurar ambiente de teste
echo "⚙️ Configurando ambiente de teste..."
cat > supabase/config.toml << EOF
# Configuração do ambiente de teste
project_id = "test-rbac-$(date +%s)"
api_url = "http://localhost:54321"
db_url = "postgresql://postgres:postgres@localhost:54322/postgres"
studio_url = "http://localhost:54323"
inbucket_url = "http://localhost:54324"
anon_key = "test-anon-key"
service_role_key = "test-service-role-key"

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
port = 54323

[inbucket]
port = 54324
smtp_port = 54325
pop3_port = 54326

[storage]
port = 54327
file_size_limit = "50MiB"
EOF

# Copiar migrações para o ambiente de teste
echo "📋 Copiando migrações para ambiente de teste..."
cp -r ../supabase/migrations/* supabase/migrations/

# Iniciar ambiente de teste
echo "🔄 Iniciando ambiente de teste..."
supabase start

# Aguardar ambiente estar pronto
echo "⏳ Aguardando ambiente estar pronto..."
sleep 10

# Executar migrações no ambiente de teste
echo "📦 Executando migrações no ambiente de teste..."
supabase db reset

# Popular dados de teste
echo "👥 Populando dados de teste..."
supabase db shell --file ../scripts/populate-test-data.sql

# Executar testes
echo "🧪 Executando testes..."
supabase db shell --file ../scripts/test-rbac-system.sql

echo "✅ Ambiente de teste criado com sucesso!"
echo ""
echo "🔗 URLs do ambiente de teste:"
echo "   - API: http://localhost:54321"
echo "   - Studio: http://localhost:54323"
echo "   - Database: postgresql://postgres:postgres@localhost:54322/postgres"
echo ""
echo "📋 Próximos passos:"
echo "   1. Testar funcionalidades no ambiente de teste"
echo "   2. Validar permissões e acesso"
echo "   3. Executar testes automatizados"
echo "   4. Se tudo estiver OK, prosseguir com implementação em produção"
echo ""
echo "🛑 Para parar o ambiente de teste:"
echo "   cd $TEST_DIR && supabase stop"




