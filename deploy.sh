#!/bin/bash

# Script para deploy manual no Vercel
echo "🚀 Iniciando deploy manual..."

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrado. Instalando..."
    npm install -g vercel
fi

# Fazer login no Vercel (se necessário)
echo "🔐 Verificando autenticação..."
vercel whoami

# Deploy para produção
echo "📦 Fazendo deploy para produção..."
vercel --prod

echo "✅ Deploy concluído!"

