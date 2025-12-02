# 🚀 Guia de Deploy - PloutosLedger

Este documento contém instruções completas para fazer o deploy do PloutosLedger em produção.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Banco de dados (SQLite padrão, ou PostgreSQL/MySQL para produção)
- Servidor web (Nginx, Apache, ou plataforma de hosting)
- Domínio configurado (opcional, mas recomendado)

## 🔧 Configuração de Variáveis de Ambiente

### 1. Criar arquivo `.env`

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# ============================================
# Ambiente
# ============================================
NODE_ENV=production
PORT=4000

# ============================================
# Segurança (OBRIGATÓRIO)
# ============================================
# Gere uma chave segura com: openssl rand -base64 32
JWT_SECRET=SUA_CHAVE_SECRETA_AQUI

# ============================================
# CORS
# ============================================
# URLs permitidas separadas por vírgula
CORS_ORIGIN=https://seu-dominio.com,https://www.seu-dominio.com

# ============================================
# WhatsApp / CallMeBot (Opcional)
# ============================================
CALLMEBOT_API_KEY=sua_api_key
ADMIN_PHONE=+5511999999999

# ============================================
# Aplicação Frontend
# ============================================
VITE_APP_DOMAIN=seu-dominio.com
VITE_APP_PROTOCOL=https
VITE_API_BASE_URL=https://api.seu-dominio.com

# ============================================
# Limites
# ============================================
MAX_BODY_SIZE=10485760
```

### 2. Gerar JWT_SECRET

**IMPORTANTE**: Nunca use a chave padrão em produção!

```bash
# Opção 1: OpenSSL
openssl rand -base64 32

# Opção 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🏗️ Build da Aplicação

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados

```bash
# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:migrate:deploy
```

### 3. Build do Frontend

```bash
npm run build:prod
```

### 4. Build do Backend

```bash
npm run server:build
```

## 🚀 Deploy em Diferentes Plataformas

### Opção 1: Deploy com PM2 (Recomendado)

#### 1. Instalar PM2

```bash
npm install -g pm2
```

#### 2. Iniciar Aplicação

```bash
npm run start:prod
```

#### 3. Configurar PM2 para iniciar no boot

```bash
pm2 startup
pm2 save
```

### Opção 2: Deploy com Nginx + Node.js

#### 1. Configurar Nginx

Crie o arquivo `/etc/nginx/sites-available/ploutosledger`:

```nginx
# Frontend
server {
    listen 80;
    server_name seu-dominio.com;
    
    root /var/www/ploutosledger/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API
server {
    listen 80;
    server_name api.seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 2. Habilitar Site

```bash
sudo ln -s /etc/nginx/sites-available/ploutosledger /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 3. Configurar SSL com Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com -d api.seu-dominio.com
```

### Opção 3: Deploy no Vercel

#### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

#### 2. Deploy

```bash
vercel --prod
```

O arquivo `vercel.json` já está configurado.

### Opção 4: Deploy no Railway/Render

1. Conecte seu repositório Git
2. Configure as variáveis de ambiente
3. O deploy será automático

## 🔒 Segurança em Produção

### Checklist de Segurança

- [ ] JWT_SECRET configurado e seguro
- [ ] CORS_ORIGIN configurado corretamente
- [ ] HTTPS habilitado
- [ ] Firewall configurado
- [ ] Backups automáticos do banco de dados
- [ ] Logs de erro configurados
- [ ] Rate limiting habilitado
- [ ] Validações de entrada ativas

### Headers de Segurança

O servidor já inclui os seguintes headers de segurança:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## 📊 Monitoramento

### Logs

Os logs são salvos em:
- PM2: `./logs/pm2-error.log` e `./logs/pm2-out.log`
- Aplicação: Console do servidor

### Health Check

O endpoint `/health` está disponível para verificar se o servidor está online:

```bash
curl http://localhost:4000/health
```

## 🔄 Atualizações

### Processo de Atualização

1. Fazer backup do banco de dados
2. Fazer pull das atualizações
3. Instalar dependências: `npm install`
4. Executar migrações: `npm run db:migrate:deploy`
5. Build: `npm run build:prod && npm run server:build`
6. Reiniciar: `pm2 restart ploutosledger-api`

## 🐛 Troubleshooting

### Problema: Porta já em uso

```bash
# Verificar processo na porta 4000
lsof -i :4000
# ou
netstat -tulpn | grep 4000

# Matar processo
kill -9 <PID>
```

### Problema: Erro de permissão

```bash
# Dar permissões corretas
chmod +x dist-server/index.js
```

### Problema: Banco de dados não conecta

```bash
# Verificar se o arquivo existe
ls -la prisma/dev.db

# Verificar permissões
chmod 644 prisma/dev.db
```

## 📞 Suporte

Para problemas ou dúvidas:
- Verificar logs: `pm2 logs ploutosledger-api`
- Verificar status: `pm2 status`
- Verificar health: `curl http://localhost:4000/health`

---

**Desenvolvido com ❤️ para controle de caixa eficiente**

