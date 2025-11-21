#!/bin/bash

# ============================================
# PLOUTOS LEDGER - Script de Backup do Banco de Dados
# ============================================

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

echo "💾 Iniciando backup do banco de dados..."

# Verificar tipo de banco de dados
if [ -f "prisma/dev.db" ] || [ -f "prisma/data/prod.db" ]; then
    # SQLite
    DB_FILE=""
    if [ -f "prisma/data/prod.db" ]; then
        DB_FILE="prisma/data/prod.db"
    elif [ -f "prisma/dev.db" ]; then
        DB_FILE="prisma/dev.db"
    fi
    
    if [ -n "$DB_FILE" ]; then
        BACKUP_FILE="$BACKUP_DIR/ploutosledger_sqlite_$TIMESTAMP.db"
        cp "$DB_FILE" "$BACKUP_FILE"
        echo "✅ Backup SQLite criado: $BACKUP_FILE"
    fi
elif [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" == postgresql* ]]; then
    # PostgreSQL
    BACKUP_FILE="$BACKUP_DIR/ploutosledger_postgres_$TIMESTAMP.sql"
    pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
    gzip "$BACKUP_FILE"
    echo "✅ Backup PostgreSQL criado: ${BACKUP_FILE}.gz"
elif [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" == mysql* ]]; then
    # MySQL/MariaDB
    BACKUP_FILE="$BACKUP_DIR/ploutosledger_mysql_$TIMESTAMP.sql"
    mysqldump "$DATABASE_URL" > "$BACKUP_FILE"
    gzip "$BACKUP_FILE"
    echo "✅ Backup MySQL criado: ${BACKUP_FILE}.gz"
else
    echo "❌ Tipo de banco de dados não reconhecido"
    exit 1
fi

# Limpar backups antigos
echo "🧹 Limpando backups antigos (mais de $RETENTION_DAYS dias)..."
find "$BACKUP_DIR" -name "ploutosledger_*" -type f -mtime +$RETENTION_DAYS -delete

echo "✅ Backup concluído!"

