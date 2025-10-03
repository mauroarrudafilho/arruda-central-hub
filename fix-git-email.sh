#!/bin/bash

echo "🔧 Configurando email do Git..."

# Configurar email correto
git config --global user.email "maurofilho@grupoarruda.com"
git config --global user.name "Mauro Arruda Filho"

echo "✅ Email configurado:"
git config --global user.email
git config --global user.name

echo "🔄 Corrigindo último commit..."
git commit --amend --reset-author --no-edit

echo "📤 Enviando para GitHub..."
git push --force-with-lease origin main

echo "✅ Commit corrigido e enviado!"
echo "🚀 Deploy automático deve funcionar agora!"

