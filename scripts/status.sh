#!/bin/bash

# ============================================
# Script de Status para PloutosLedger
# ============================================

echo "📊 Status do PloutosLedger"
echo "=========================="
echo ""

# Verificar PM2
if command -v pm2 &> /dev/null; then
    echo "📦 PM2:"
    pm2 list | grep -E "(ploutosledger|name|status|cpu|memory)" || echo "  Nenhum processo PM2 encontrado"
    echo ""
fi

# Verificar Docker
if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
    echo "🐳 Docker:"
    docker-compose ps 2>/dev/null || echo "  Containers não estão rodando"
    echo ""
fi

# Verificar Systemd
if command -v systemctl &> /dev/null; then
    echo "⚙️ Systemd:"
    systemctl status ploutosledger --no-pager -l 2>/dev/null | head -n 10 || echo "  Serviço não encontrado"
    echo ""
fi

# Verificar Health Check
if [ -f "scripts/healthcheck.sh" ]; then
    echo "🏥 Health Check:"
    bash scripts/healthcheck.sh 2>&1 || echo "  Health check falhou"
    echo ""
fi

# Verificar Banco de Dados
if [ -f ".env" ]; then
    echo "🗄️ Banco de Dados:"
    if grep -q "DATABASE_URL" .env; then
        DB_URL=$(grep "DATABASE_URL" .env | cut -d'=' -f2 | tr -d '"')
        if [[ "$DB_URL" == file:* ]]; then
            DB_FILE=$(echo "$DB_URL" | sed 's|file:||')
            if [ -f "$DB_FILE" ]; then
                echo "  ✅ SQLite: $DB_FILE ($(du -h "$DB_FILE" | cut -f1))"
            else
                echo "  ❌ SQLite: arquivo não encontrado"
            fi
        elif [[ "$DB_URL" == postgresql* ]]; then
            echo "  ✅ PostgreSQL: configurado"
        elif [[ "$DB_URL" == mysql* ]]; then
            echo "  ✅ MySQL: configurado"
        fi
    else
        echo "  ⚠️ DATABASE_URL não configurado"
    fi
    echo ""
fi

echo "✅ Verificação completa!"

