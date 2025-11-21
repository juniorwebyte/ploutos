#!/bin/bash

# ============================================
# Script de Restart para PloutosLedger
# ============================================

set -e

echo "🔄 Reiniciando PloutosLedger..."

# Verificar se PM2 está instalado
if command -v pm2 &> /dev/null; then
    echo "🔄 Reiniciando via PM2..."
    pm2 restart ecosystem.config.js --env production || pm2 restart ploutosledger-api
    pm2 save
    echo "✅ Reiniciado via PM2"
elif command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
    echo "🔄 Reiniciando via Docker Compose..."
    docker-compose restart app
    echo "✅ Reiniciado via Docker"
elif command -v systemctl &> /dev/null; then
    echo "🔄 Reiniciando via Systemd..."
    sudo systemctl restart ploutosledger
    echo "✅ Reiniciado via Systemd"
else
    echo "❌ Não foi possível encontrar método de restart"
    echo "⚠️ Por favor, reinicie manualmente"
    exit 1
fi

echo "✅ Restart concluído!"

