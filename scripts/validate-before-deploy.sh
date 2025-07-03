#!/bin/bash

# Script de validação antes do deploy
# Este script deve ser executado antes de fazer push para evitar erros de deploy

echo "🔍 Validando código antes do deploy..."

# Validar backend
echo "📡 Validando backend..."
cd backend
npm run validate
if [ $? -ne 0 ]; then
    echo "❌ Erro de validação no backend!"
    exit 1
fi
echo "✅ Backend validado com sucesso!"

# Validar frontend
echo "🎨 Validando frontend..."
cd ../frontend
npm run validate
if [ $? -ne 0 ]; then
    echo "❌ Erro de validação no frontend!"
    exit 1
fi
echo "✅ Frontend validado com sucesso!"

# Tentar build do frontend
echo "🏗️ Testando build do frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro no build do frontend!"
    exit 1
fi
echo "✅ Build do frontend bem-sucedido!"

echo "🎉 Todas as validações passaram! Seguro para deploy."