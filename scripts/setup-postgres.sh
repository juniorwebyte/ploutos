#!/bin/bash

# ============================================
# PLOUTOS LEDGER - Script de Setup PostgreSQL
# ============================================

set -e

echo "🗄️ Configurando PostgreSQL para PloutosLedger..."

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL não encontrado. Instalando..."
    apt-get update
    apt-get install -y postgresql postgresql-contrib
fi

# Configurar banco de dados
DB_NAME="${POSTGRES_DB:-ploutosledger}"
DB_USER="${POSTGRES_USER:-ploutos}"
DB_PASS="${POSTGRES_PASSWORD:-$(openssl rand -base64 32)}"

echo "📝 Criando banco de dados: $DB_NAME"
echo "👤 Criando usuário: $DB_USER"

# Criar usuário e banco de dados
sudo -u postgres psql <<EOF
-- Criar usuário
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';

-- Criar banco de dados
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Dar privilégios
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Conectar ao banco e dar privilégios no schema
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOF

# Atualizar DATABASE_URL no .env
if [ -f ".env" ]; then
    echo "📝 Atualizando DATABASE_URL no .env..."
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public\"|" .env
else
    echo "📝 Criando arquivo .env com DATABASE_URL..."
    echo "DATABASE_URL=\"postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public\"" >> .env
fi

echo "✅ PostgreSQL configurado com sucesso!"
echo "📋 Credenciais salvas no arquivo .env"
echo "   DB_USER: $DB_USER"
echo "   DB_NAME: $DB_NAME"
echo "   DB_PASS: [salvo no .env]"

