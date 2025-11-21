#!/bin/bash

# ============================================
# PLOUTOS LEDGER - Migração de SQLite para PostgreSQL
# ============================================

set -e

echo "🔄 Migrando banco de dados de SQLite para PostgreSQL..."

# Verificar se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não está configurada"
    echo "Configure DATABASE_URL no arquivo .env antes de continuar"
    exit 1
fi

# Verificar se é uma URL PostgreSQL
if [[ ! "$DATABASE_URL" == postgresql* ]]; then
    echo "❌ DATABASE_URL não é uma URL PostgreSQL válida"
    exit 1
fi

# Localizar banco SQLite
SQLITE_DB=""
if [ -f "prisma/data/prod.db" ]; then
    SQLITE_DB="prisma/data/prod.db"
elif [ -f "prisma/dev.db" ]; then
    SQLITE_DB="prisma/dev.db"
else
    echo "❌ Banco de dados SQLite não encontrado"
    exit 1
fi

echo "📁 Banco SQLite encontrado: $SQLITE_DB"
echo "🔗 URL PostgreSQL: ${DATABASE_URL:0:50}..."

# Exportar dados do SQLite
echo "📤 Exportando dados do SQLite..."
sqlite3 "$SQLITE_DB" ".dump" > /tmp/ploutosledger_dump.sql

# Criar schema no PostgreSQL
echo "🗄️ Criando schema no PostgreSQL..."
export DATABASE_PROVIDER="postgresql"
npx prisma migrate deploy

# Importar dados (usar prisma studio ou scripts customizados)
echo "📥 Dados exportados em: /tmp/ploutosledger_dump.sql"
echo "⚠️ A importação dos dados precisa ser feita manualmente"
echo "   Use Prisma Studio ou scripts de migração customizados"

echo "✅ Migração iniciada!"
echo "📋 Próximos passos:"
echo "   1. Verificar schema no PostgreSQL"
echo "   2. Importar dados do SQLite"
echo "   3. Verificar integridade dos dados"

