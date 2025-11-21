#!/bin/bash

# ============================================
# Script para configurar DATABASE_URL e provider automaticamente
# ============================================

set -e

SCHEMA_FILE="prisma/schema.prisma"
ENV_FILE=".env"

echo "🔧 Configurando banco de dados..."

# Verificar se .env existe
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Criando arquivo .env..."
    cp env.example "$ENV_FILE"
fi

# Perguntar tipo de banco
echo "Selecione o tipo de banco de dados:"
echo "1) SQLite (desenvolvimento/teste)"
echo "2) PostgreSQL (produção recomendado)"
echo "3) MySQL (produção)"
read -p "Escolha (1-3): " choice

case $choice in
    1)
        PROVIDER="sqlite"
        DB_URL="file:./prisma/dev.db"
        mkdir -p prisma
        echo "✅ Configurado para SQLite"
        ;;
    2)
        PROVIDER="postgresql"
        read -p "Host PostgreSQL [localhost]: " DB_HOST
        DB_HOST=${DB_HOST:-localhost}
        read -p "Porta PostgreSQL [5432]: " DB_PORT
        DB_PORT=${DB_PORT:-5432}
        read -p "Usuário PostgreSQL: " DB_USER
        read -sp "Senha PostgreSQL: " DB_PASS
        echo
        read -p "Nome do banco [ploutosledger]: " DB_NAME
        DB_NAME=${DB_NAME:-ploutosledger}
        DB_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"
        echo "✅ Configurado para PostgreSQL"
        ;;
    3)
        PROVIDER="mysql"
        read -p "Host MySQL [localhost]: " DB_HOST
        DB_HOST=${DB_HOST:-localhost}
        read -p "Porta MySQL [3306]: " DB_PORT
        DB_PORT=${DB_PORT:-3306}
        read -p "Usuário MySQL: " DB_USER
        read -sp "Senha MySQL: " DB_PASS
        echo
        read -p "Nome do banco [ploutosledger]: " DB_NAME
        DB_NAME=${DB_NAME:-ploutosledger}
        DB_URL="mysql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"
        echo "✅ Configurado para MySQL"
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

# Atualizar .env
if grep -q "DATABASE_PROVIDER" "$ENV_FILE"; then
    sed -i.bak "s|DATABASE_PROVIDER=.*|DATABASE_PROVIDER=$PROVIDER|" "$ENV_FILE"
else
    echo "DATABASE_PROVIDER=$PROVIDER" >> "$ENV_FILE"
fi

if grep -q "DATABASE_URL" "$ENV_FILE"; then
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"$DB_URL\"|" "$ENV_FILE"
else
    echo "DATABASE_URL=\"$DB_URL\"" >> "$ENV_FILE"
fi

# Remover backup
rm -f "$ENV_FILE.bak"

# Atualizar schema.prisma
if [ "$PROVIDER" != "sqlite" ]; then
    sed -i.bak "s/provider = .*/provider = \"$PROVIDER\"/" "$SCHEMA_FILE"
    rm -f "$SCHEMA_FILE.bak"
fi

echo "✅ Configuração concluída!"
echo "📝 Execute 'npx prisma generate' para gerar o cliente"
echo "📝 Execute 'npx prisma migrate deploy' para executar migrações"

