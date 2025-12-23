# 🚀 Guia de Deploy - PloutosLedger

Este guia cobre o deploy do PloutosLedger em diferentes plataformas.

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- npm >= 8.0.0
- Banco de dados (SQLite, PostgreSQL ou MySQL)
- Variáveis de ambiente configuradas

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Ambiente
NODE_ENV=production

# API e Backend
VITE_API_URL=https://api.seudominio.com
VITE_API_BASE_URL=https://api.seudominio.com

# Domínio
VITE_APP_DOMAIN=seudominio.com
VITE_APP_PROTOCOL=https

# Banco de Dados
DATABASE_URL="postgresql://user:password@localhost:5432/ploutosledger"

# Segurança
JWT_SECRET=seu-jwt-secret-super-seguro-aqui
JWT_EXPIRES_IN=7d
SESSION_SECRET=seu-session-secret-aqui

# Portas
PORT=4000

# Logs
VITE_LOG_LEVEL=info

# Integrações (opcional)
VITE_CALLMEBOT_API_KEY=sua-chave
VITE_ADMIN_PHONE=5511984801839
```

## 🌐 Deploy em Vercel

### 1. Configuração

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente no painel da Vercel
3. O arquivo `vercel.json` já está configurado

### 2. Build Settings

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 3. Variáveis de Ambiente na Vercel

Adicione todas as variáveis `VITE_*` no painel da Vercel:
- `VITE_API_URL`
- `VITE_API_BASE_URL`
- `VITE_APP_DOMAIN`
- `VITE_APP_PROTOCOL`
- `VITE_LOG_LEVEL`

### 4. Deploy

```bash
# Via CLI
vercel --prod

# Ou faça push para a branch main
git push origin main
```

## 🚂 Deploy em Railway

### 1. Configuração

1. Conecte seu repositório ao Railway
2. Railway detecta automaticamente o projeto Node.js

### 2. Variáveis de Ambiente

Configure no painel do Railway:
- Todas as variáveis de ambiente necessárias
- `DATABASE_URL` será criada automaticamente se usar PostgreSQL

### 3. Build Command

Railway usa automaticamente:
- `npm install`
- `npm run build`

### 4. Start Command

Configure como:
```bash
npm run server:prod
```

## 🎯 Deploy em Render

### 1. Configuração

1. Crie um novo Web Service no Render
2. Conecte seu repositório

### 2. Build Settings

- **Build Command:** `npm install && npm run build && npm run server:build`
- **Start Command:** `npm run server:prod`

### 3. Variáveis de Ambiente

Adicione todas as variáveis necessárias no painel do Render

## 🐳 Deploy com Docker

### 1. Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm run server:build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/prisma ./prisma

RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "server:prod"]
```

### 2. Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/ploutosledger
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=ploutos
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=ploutosledger
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## ☁️ Deploy em PM2 (VPS/Dedicado)

### 1. Preparação

```bash
# Instalar dependências
npm install

# Build
npm run build
npm run server:build

# Gerar Prisma Client
npx prisma generate
```

### 2. Configuração PM2

O arquivo `ecosystem.config.js` já está configurado.

### 3. Iniciar

```bash
# Produção
pm2 start ecosystem.config.js --env production

# Verificar status
pm2 status

# Logs
pm2 logs ploutosledger-api
```

### 4. Atualizar

```bash
# Pull das mudanças
git pull origin main

# Rebuild
npm run build
npm run server:build

# Restart
pm2 restart ploutosledger-api
```

## 🔒 Segurança em Produção

### 1. HTTPS

- Configure SSL/TLS (Let's Encrypt recomendado)
- Force HTTPS em todas as rotas

### 2. Variáveis Sensíveis

- **NUNCA** commite `.env` no Git
- Use variáveis de ambiente do provedor
- Rotacione secrets regularmente

### 3. Headers de Segurança

Configure no servidor:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

## 📊 Monitoramento

### 1. Logs

- Use PM2 logs em produção
- Configure log rotation
- Monitore erros e warnings

### 2. Performance

- Monitore uso de memória
- Configure alertas de CPU
- Use ferramentas como New Relic ou Datadog

## 🔄 Atualizações

### 1. Backup Antes de Atualizar

```bash
# Backup do banco de dados
pg_dump ploutosledger > backup.sql

# Backup dos arquivos
tar -czf backup.tar.gz dist/ dist-server/
```

### 2. Processo de Atualização

1. Fazer backup
2. Pull das mudanças
3. Instalar dependências: `npm install`
4. Rodar migrations: `npx prisma migrate deploy`
5. Build: `npm run build && npm run server:build`
6. Restart: `pm2 restart ploutosledger-api`

## 🐛 Troubleshooting

### Erro: "Cannot find module"

```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Prisma Client not generated"

```bash
npx prisma generate
```

### Erro: "Port already in use"

```bash
# Verificar processo
lsof -i :4000

# Matar processo
kill -9 <PID>
```

## 📝 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados configurado e migrado
- [ ] Build executado com sucesso
- [ ] Testes passando
- [ ] HTTPS configurado
- [ ] Logs configurados
- [ ] Monitoramento ativo
- [ ] Backup configurado
- [ ] Documentação atualizada

## 🆘 Suporte

Para problemas de deploy:
1. Verifique os logs
2. Verifique variáveis de ambiente
3. Verifique conectividade do banco
4. Consulte a documentação
5. Entre em contato com o suporte

