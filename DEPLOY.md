# 🚀 PloutosLedger - Guia Completo de Deploy

Este guia fornece instruções detalhadas para fazer deploy do PloutosLedger em diferentes plataformas e ambientes.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
3. [Deploy em VPS Tradicional](#deploy-em-vps-tradicional)
4. [Deploy no Vercel](#deploy-no-vercel)
5. [Deploy no Bolt.new](#deploy-no-boltnew)
6. [Deploy com Docker](#deploy-com-docker)
7. [Deploy no Railway](#deploy-no-railway)
8. [Deploy no Render](#deploy-no-render)
9. [Troubleshooting](#troubleshooting)

---

## 📦 Pré-requisitos

### Requisitos do Sistema
- **Node.js**: Versão 18.x ou superior
- **NPM**: Versão 8.x ou superior
- **Banco de Dados**: SQLite (dev) ou PostgreSQL/MySQL (produção)
- **Memória**: Mínimo 512MB RAM (recomendado 1GB+)
- **Disco**: Mínimo 1GB livre

### Requisitos por Plataforma
- **VPS**: Ubuntu 20.04+ / Debian 11+
- **Vercel**: Conta no Vercel
- **Docker**: Docker 20.10+
- **Bolt.new**: Conta no Bolt.new

---

## 🔐 Configuração de Variáveis de Ambiente

1. **Copie o arquivo de exemplo:**
   ```bash
   cp env.example .env
   ```

2. **Configure as variáveis necessárias:**

### Variáveis Obrigatórias

```env
# Ambiente
NODE_ENV=production

# Servidor
PORT=4000
HOST=0.0.0.0

# Database (PostgreSQL recomendado para produção)
DATABASE_URL="postgresql://usuario:senha@localhost:5432/ploutosledger?schema=public"
DATABASE_PROVIDER=postgresql

# Segurança (IMPORTANTE: Gere uma chave forte!)
JWT_SECRET=$(openssl rand -base64 32)

# CORS
CORS_ORIGIN=https://seu-dominio.com
```

### Variáveis Opcionais

```env
# Frontend
VITE_API_BASE_URL=https://api.seu-dominio.com
VITE_APP_DOMAIN=seu-dominio.com
VITE_APP_PROTOCOL=https

# Integrações
CALLMEBOT_API_KEY=sua-chave
ADMIN_PHONE=+5511999999999
```

### Gerar JWT_SECRET Seguro

```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🖥️ Deploy em VPS Tradicional

### Método 1: Script Automatizado

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/ploutos-ledger.git
cd ploutos-ledger

# Execute o script de deploy (requer sudo)
chmod +x scripts/deploy-vps.sh
sudo ./scripts/deploy-vps.sh
```

### Método 2: Manual

#### 1. Preparar o Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx

# Instalar PostgreSQL (opcional)
sudo apt install -y postgresql postgresql-contrib
```

#### 2. Configurar Banco de Dados

**Opção A: SQLite (desenvolvimento/teste)**
```bash
mkdir -p prisma/data
# O SQLite será criado automaticamente
```

**Opção B: PostgreSQL (produção recomendado)**
```bash
# Criar usuário e banco
sudo -u postgres createuser ploutos
sudo -u postgres createdb ploutosledger -O ploutos

# Definir senha
sudo -u postgres psql -c "ALTER USER ploutos WITH PASSWORD 'sua-senha-forte';"
```

#### 3. Configurar Aplicação

```bash
# Criar diretório
sudo mkdir -p /opt/ploutosledger
sudo chown -R $USER:$USER /opt/ploutosledger

# Copiar código
cp -r . /opt/ploutosledger/
cd /opt/ploutosledger

# Instalar dependências
npm ci

# Configurar variáveis de ambiente
cp env.example .env
nano .env  # Edite conforme necessário

# Gerar Prisma Client
npx prisma generate

# Executar migrações
npx prisma migrate deploy

# Build da aplicação
npm run build
npm run server:build
```

#### 4. Configurar PM2

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Salvar configuração
pm2 save

# Configurar auto-start
pm2 startup
# Execute o comando retornado
```

#### 5. Configurar Nginx

```bash
# Copiar configuração
sudo cp nginx.conf /etc/nginx/sites-available/ploutosledger

# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/ploutosledger /etc/nginx/sites-enabled/

# Remover default
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

#### 6. Configurar SSL (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática
sudo certbot renew --dry-run
```

#### 7. Configurar Firewall

```bash
# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable
```

---

## ☁️ Deploy no Vercel

### Configuração

1. **Instalar Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Fazer login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### Configuração via Dashboard

1. Acesse [vercel.com](https://vercel.com)
2. Importe seu repositório
3. Configure variáveis de ambiente:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CORS_ORIGIN`
   - `VITE_API_BASE_URL`
4. Deploy automático será ativado

### Nota sobre Backend

O Vercel é otimizado para frontend. Para o backend completo:
- **Opção 1**: Deploy do backend separado em VPS/Railway/Render
- **Opção 2**: Usar Vercel Serverless Functions (configurar rotas específicas)
- **Opção 3**: Usar `vercel-serverless.json` para deploy apenas do frontend

---

## ⚡ Deploy no Bolt.new

1. Acesse [bolt.new](https://bolt.new)
2. Conecte seu repositório GitHub
3. O Bolt.new detectará automaticamente o `bolt.json`
4. Configure variáveis de ambiente no painel
5. Deploy será feito automaticamente

### Configuração Manual

```bash
# Instalar Bolt CLI
npm install -g @bolt/new-cli

# Deploy
bolt deploy
```

---

## 🐳 Deploy com Docker

### Docker Compose (Recomendado)

1. **Configurar variáveis de ambiente:**
   ```bash
   cp env.example .env
   # Edite o .env
   ```

2. **Iniciar containers:**
   ```bash
   docker-compose up -d
   ```

3. **Verificar logs:**
   ```bash
   docker-compose logs -f app
   ```

### Docker Individual

1. **Build da imagem:**
   ```bash
   docker build -t ploutosledger .
   ```

2. **Executar container:**
   ```bash
   docker run -d \
     --name ploutosledger \
     -p 4000:4000 \
     --env-file .env \
     -v $(pwd)/prisma/data:/app/prisma/data \
     ploutosledger
   ```

---

## 🚂 Deploy no Railway

1. Acesse [railway.app](https://railway.app)
2. Crie novo projeto
3. Conecte repositório GitHub
4. Adicione serviço PostgreSQL (se necessário)
5. Configure variáveis de ambiente
6. Deploy automático será ativado

### Railway.json (Opcional)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build && npm run server:build && npx prisma generate"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100
  }
}
```

---

## 🌐 Deploy no Render

1. Acesse [render.com](https://render.com)
2. Crie novo Web Service
3. Conecte repositório GitHub
4. Configure:
   - **Build Command**: `npm install && npm run build && npm run server:build && npx prisma generate`
   - **Start Command**: `npm run start:prod`
5. Adicione PostgreSQL Database (se necessário)
6. Configure variáveis de ambiente
7. Deploy

---

## 🔧 Troubleshooting

### Erro: "JWT_SECRET não configurado"
**Solução:** Configure `JWT_SECRET` no arquivo `.env`

### Erro: "Cannot connect to database"
**Solução:** 
- Verifique `DATABASE_URL` no `.env`
- Verifique se o banco está rodando
- Teste conexão: `npx prisma db pull`

### Erro: "Port already in use"
**Solução:** 
- Altere `PORT` no `.env`
- Ou pare o processo: `lsof -ti:4000 | xargs kill`

### Erro: "Prisma Client not generated"
**Solução:**
```bash
npx prisma generate
```

### Performance Lenta
**Solução:**
- Use PostgreSQL ao invés de SQLite
- Configure cache (Redis)
- Otimize queries do Prisma
- Use CDN para assets estáticos

---

## 📞 Suporte

Para mais ajuda:
- 📧 Email: suporte@webyte.com
- 💬 Discord: [link]
- 📖 Documentação: [link]

---

## 📝 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados configurado e migrado
- [ ] JWT_SECRET gerado e configurado
- [ ] Build da aplicação executado
- [ ] Testes de saúde (`/health`) funcionando
- [ ] SSL/HTTPS configurado (produção)
- [ ] Backups configurados
- [ ] Monitoramento configurado
- [ ] Logs configurados
- [ ] Firewall configurado

---

**Última atualização:** 2024

