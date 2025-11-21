#!/bin/bash

# ============================================
# Script para atualizar schema.prisma baseado em DATABASE_PROVIDER
# ============================================

set -e

# Carregar variáveis de ambiente
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

SCHEMA_FILE="prisma/schema.prisma"
PROVIDER="${DATABASE_PROVIDER:-sqlite}"

echo "🔄 Atualizando schema.prisma para usar provider: $PROVIDER"

# Backup do schema original
cp "$SCHEMA_FILE" "$SCHEMA_FILE.bak"

# Atualizar provider no schema
if [ "$PROVIDER" == "postgresql" ]; then
    sed -i.bak 's/provider = .*/provider = "postgresql"/' "$SCHEMA_FILE"
    echo "✅ Schema atualizado para PostgreSQL"
elif [ "$PROVIDER" == "mysql" ]; then
    sed -i.bak 's/provider = .*/provider = "mysql"/' "$SCHEMA_FILE"
    echo "✅ Schema atualizado para MySQL"
else
    sed -i.bak 's/provider = .*/provider = "sqlite"/' "$SCHEMA_FILE"
    echo "✅ Schema atualizado para SQLite"
fi

# Remover backup
rm -f "$SCHEMA_FILE.bak"

echo "✅ Schema atualizado com sucesso!"
echo "📝 Execute 'npx prisma generate' para regenerar o cliente"

