#!/bin/bash

# ============================================
# PLOUTOS LEDGER - Script de Deploy para VPS
# ============================================

set -e

echo "🚀 Iniciando deploy do PloutosLedger..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Por favor, execute como root ou com sudo${NC}"
    exit 1
fi

# Diretório de instalação
APP_DIR="/opt/ploutosledger"
SERVICE_USER="ploutos"

# Criar usuário do sistema (se não existir)
if ! id "$SERVICE_USER" &>/dev/null; then
    echo -e "${YELLOW}Criando usuário do sistema...${NC}"
    useradd -r -s /bin/bash -d "$APP_DIR" -m "$SERVICE_USER"
fi

# Criar diretório da aplicação
mkdir -p "$APP_DIR"
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"

# Instalar Node.js 18.x (se não estiver instalado)
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Instalando Node.js 18.x...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Instalar PM2 globalmente (se não estiver instalado)
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Instalando PM2...${NC}"
    npm install -g pm2
fi

# Instalar Nginx (se não estiver instalado)
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Instalando Nginx...${NC}"
    apt-get update
    apt-get install -y nginx
fi

# Copiar código para diretório de instalação
echo -e "${YELLOW}Copiando arquivos da aplicação...${NC}"
cp -r . "$APP_DIR/"
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"

# Instalar dependências
echo -e "${YELLOW}Instalando dependências...${NC}"
cd "$APP_DIR"
sudo -u "$SERVICE_USER" npm ci --production=false

# Gerar Prisma Client
echo -e "${YELLOW}Gerando Prisma Client...${NC}"
sudo -u "$SERVICE_USER" npx prisma generate

# Executar migrações
echo -e "${YELLOW}Executando migrações do banco de dados...${NC}"
sudo -u "$SERVICE_USER" npx prisma migrate deploy

# Build da aplicação
echo -e "${YELLOW}Build da aplicação...${NC}"
sudo -u "$SERVICE_USER" npm run build
sudo -u "$SERVICE_USER" npm run server:build

# Instalar dependências de produção
echo -e "${YELLOW}Instalando dependências de produção...${NC}"
sudo -u "$SERVICE_USER" npm ci --production

# Configurar PM2
echo -e "${YELLOW}Configurando PM2...${NC}"
pm2 delete ploutosledger-api 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u "$SERVICE_USER" --hp "$APP_DIR"

# Configurar Nginx
echo -e "${YELLOW}Configurando Nginx...${NC}"
cp "$APP_DIR/nginx.conf" /etc/nginx/sites-available/ploutosledger
ln -sf /etc/nginx/sites-available/ploutosledger /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Configurar firewall (UFW)
if command -v ufw &> /dev/null; then
    echo -e "${YELLOW}Configurando firewall...${NC}"
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 4000/tcp 2>/dev/null || true
fi

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}Aplicação rodando em: http://localhost:4000${NC}"
echo -e "${YELLOW}Verifique o arquivo .env em $APP_DIR${NC}"

