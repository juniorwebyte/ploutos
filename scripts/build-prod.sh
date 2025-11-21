#!/bin/bash

# ============================================
# PLOUTOS LEDGER - Script de Build para Produção
# ============================================

set -e

echo "🔨 Iniciando build para produção..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 18+"
    exit 1
fi

# Verificar NPM
if ! command -v npm &> /dev/null; then
    echo "❌ NPM não encontrado. Por favor, instale NPM"
    exit 1
fi

# Limpar builds anteriores
echo "🧹 Limpando builds anteriores..."
rm -rf dist
rm -rf dist-server
rm -rf node_modules/.vite

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci

# Gerar Prisma Client
echo "🗄️ Gerando Prisma Client..."
npx prisma generate

# Executar migrações (apenas deploy, não cria novas)
if [ "$1" = "--migrate" ]; then
    echo "🔄 Executando migrações do banco de dados..."
    npx prisma migrate deploy
fi

# Build do frontend
echo "🎨 Build do frontend..."
NODE_ENV=production npm run build

# Build do backend
echo "⚙️ Build do backend..."
NODE_ENV=production npm run server:build

# Verificar builds
if [ ! -d "dist" ]; then
    echo "❌ Erro: Diretório dist não foi criado"
    exit 1
fi

if [ ! -d "dist-server" ]; then
    echo "❌ Erro: Diretório dist-server não foi criado"
    exit 1
fi

echo "✅ Build concluído com sucesso!"
echo "📁 Arquivos gerados:"
echo "   - Frontend: ./dist"
echo "   - Backend: ./dist-server"

