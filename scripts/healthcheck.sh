#!/bin/bash

# ============================================
# Script de Health Check para PloutosLedger
# ============================================

set -e

API_URL="${API_URL:-http://localhost:4000}"
ENDPOINT="${ENDPOINT:-/health}"
TIMEOUT="${TIMEOUT:-5}"

echo "🏥 Verificando saúde da aplicação..."
echo "📍 URL: $API_URL$ENDPOINT"

# Verificar se o endpoint está respondendo
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$API_URL$ENDPOINT" || echo "000")

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Aplicação está saudável (HTTP $HTTP_CODE)"
    
    # Verificar resposta JSON
    RESPONSE=$(curl -s --max-time "$TIMEOUT" "$API_URL$ENDPOINT" || echo "{}")
    if echo "$RESPONSE" | grep -q '"ok".*true'; then
        echo "✅ Endpoint /health retornou OK"
        exit 0
    else
        echo "⚠️ Endpoint /health retornou HTTP 200 mas resposta inesperada"
        exit 1
    fi
else
    echo "❌ Aplicação não está respondendo corretamente (HTTP $HTTP_CODE)"
    exit 1
fi

