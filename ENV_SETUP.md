# 🔐 Configuração Completa de Variáveis de Ambiente

Este documento contém a configuração completa e correta do arquivo `.env` para fazer deploy em qualquer servidor.

## 📋 Como Usar

1. Copie o conteúdo abaixo para criar um arquivo `.env` na raiz do projeto
2. Substitua os valores marcados com `[ALTERAR]` pelos seus valores reais
3. Para gerar secrets seguros, use: `openssl rand -base64 32` ou `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

---

## 🚀 Configuração Completa (.env)

```env
# ============================================
# PLOUTOS LEDGER - CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE
# ============================================

# ============================================
# AMBIENTE [OBRIGATÓRIO]
# ============================================
NODE_ENV=production

# ============================================
# BANCO DE DADOS [OBRIGATÓRIO EM PRODUÇÃO]
# ============================================
DATABASE_URL="postgresql://usuario:senha@host:5432/ploutosledger"
# Formatos:
#   PostgreSQL: postgresql://user:password@host:port/database
#   SQLite (dev): file:./prisma/dev.db
#   MySQL: mysql://user:password@host:port/database

# ============================================
# SEGURANÇA [OBRIGATÓRIO EM PRODUÇÃO]
# ============================================
JWT_SECRET=GERAR-UMA-STRING-ALEATORIA-SEGURA-MINIMO-32-CARACTERES
# Gere com: openssl rand -base64 32
# Exemplo: K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=

JWT_EXPIRES_IN=7d

SESSION_SECRET=GERAR-UMA-STRING-ALEATORIA-SEGURA-MINIMO-32-CARACTERES
# Deve ser diferente do JWT_SECRET
# Gere com: openssl rand -base64 32

# ============================================
# SERVIDOR BACKEND [OBRIGATÓRIO]
# ============================================
PORT=4000

# ============================================
# API E BACKEND [OBRIGATÓRIO - FRONTEND]
# ============================================
VITE_API_URL=https://api.seudominio.com
VITE_API_BASE_URL=https://api.seudominio.com

# ============================================
# DOMÍNIO E PROTOCOLO [OPCIONAL - FRONTEND]
# ============================================
VITE_APP_DOMAIN=seudominio.com
VITE_APP_PROTOCOL=https

# ============================================
# CORS [OBRIGATÓRIO EM PRODUÇÃO]
# ============================================
CORS_ORIGIN=https://seudominio.com,https://www.seudominio.com
# Separe múltiplos domínios por vírgula

# ============================================
# RATE LIMITING [OPCIONAL]
# ============================================
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# BODY SIZE LIMIT [OPCIONAL]
# ============================================
MAX_BODY_SIZE=10485760
# 10485760 = 10MB

# ============================================
# LOGS E DEBUG [OPCIONAL]
# ============================================
VITE_LOG_LEVEL=info
DEBUG=false

# ============================================
# INTEGRAÇÕES - WHATSAPP/CALLMEBOT [OPCIONAL]
# ============================================
CALLMEBOT_API_KEY=1782254
ADMIN_PHONE=+5511984801839
VITE_CALLMEBOT_API_KEY=1782254
VITE_ADMIN_PHONE=5511984801839

# ============================================
# EMAIL - SMTP [OPCIONAL]
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-smtp
SMTP_FROM=noreply@seudominio.com

# ============================================
# PAGAMENTOS - PIX [OPCIONAL]
# ============================================
PIX_API_KEY=sua-chave-api-pix
PIX_API_URL=https://api.pix.example.com

# ============================================
# RECURSOS OPCIONAIS [OPCIONAL]
# ============================================
ENABLE_ANALYTICS=true
ENABLE_CHAT=true
ENABLE_NOTIFICATIONS=true
ENABLE_BACKUP=true

# ============================================
# PERFORMANCE E CACHE [OPCIONAL]
# ============================================
ENABLE_CACHE=true
CACHE_TTL=3600
MAX_CACHE_SIZE=100
```

---

## 🔧 Configurações por Ambiente

### Desenvolvimento Local

```env
NODE_ENV=development
DATABASE_URL="file:./prisma/dev.db"
VITE_API_URL=http://localhost:4000
VITE_API_BASE_URL=http://localhost:4000
VITE_APP_DOMAIN=localhost
VITE_APP_PROTOCOL=http
PORT=4000
CORS_ORIGIN=*
VITE_LOG_LEVEL=debug
DEBUG=true
JWT_SECRET=dev-secret-change-me
SESSION_SECRET=dev-session-secret
```

### Produção

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@db.exemplo.com:5432/ploutosledger"
VITE_API_URL=https://api.exemplo.com
VITE_API_BASE_URL=https://api.exemplo.com
VITE_APP_DOMAIN=exemplo.com
VITE_APP_PROTOCOL=https
PORT=4000
CORS_ORIGIN=https://exemplo.com,https://www.exemplo.com
VITE_LOG_LEVEL=info
DEBUG=false
JWT_SECRET=GERAR-STRING-ALEATORIA-SEGURA-AQUI
SESSION_SECRET=GERAR-STRING-ALEATORIA-DIFERENTE-AQUI
```

---

## 📝 Checklist de Configuração

### Para Produção:

- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` configurado com banco de dados real
- [ ] `JWT_SECRET` gerado com string aleatória segura (mínimo 32 caracteres)
- [ ] `SESSION_SECRET` gerado com string aleatória diferente do JWT_SECRET
- [ ] `VITE_API_URL` apontando para o servidor backend em produção
- [ ] `VITE_APP_DOMAIN` com o domínio correto
- [ ] `VITE_APP_PROTOCOL=https`
- [ ] `CORS_ORIGIN` configurado com domínios específicos (não usar `*`)
- [ ] `DEBUG=false`
- [ ] `VITE_LOG_LEVEL=info` ou `warn`

### Para Desenvolvimento:

- [ ] `NODE_ENV=development`
- [ ] `DATABASE_URL="file:./prisma/dev.db"` (SQLite)
- [ ] `VITE_API_URL=http://localhost:4000`
- [ ] `CORS_ORIGIN=*` (ok para desenvolvimento)
- [ ] `DEBUG=true`
- [ ] `VITE_LOG_LEVEL=debug`

---

## 🔒 Gerando Secrets Seguros

### Linux/Mac:

```bash
# Gerar JWT_SECRET
openssl rand -base64 32

# Gerar SESSION_SECRET
openssl rand -base64 32
```

### Node.js:

```bash
# Gerar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Gerar SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Online:

- https://generate-secret.vercel.app/32
- https://www.random.org/strings/

---

## 🌐 Configuração por Plataforma

### Vercel (Frontend)

No painel da Vercel, adicione estas variáveis (apenas as que começam com `VITE_`):

- `VITE_API_URL`
- `VITE_API_BASE_URL`
- `VITE_APP_DOMAIN`
- `VITE_APP_PROTOCOL`
- `VITE_LOG_LEVEL`
- `VITE_CALLMEBOT_API_KEY` (se usar)
- `VITE_ADMIN_PHONE` (se usar)

### Railway/Render (Backend)

No painel da plataforma, adicione todas as variáveis SEM o prefixo `VITE_`:

- `NODE_ENV`
- `DATABASE_URL`
- `JWT_SECRET`
- `SESSION_SECRET`
- `PORT`
- `CORS_ORIGIN`
- `RATE_LIMIT_MAX_REQUESTS`
- `MAX_BODY_SIZE`
- E todas as outras variáveis do backend

---

## ⚠️ Importante

1. **NUNCA** commite o arquivo `.env` no Git
2. Use secrets fortes em produção (mínimo 32 caracteres)
3. Rotacione secrets a cada 90 dias
4. Em produção, sempre use HTTPS
5. Configure `CORS_ORIGIN` com domínios específicos (não usar `*` em produção)
6. Use senhas fortes para o banco de dados
7. Mantenha backups regulares do banco de dados
8. Monitore logs regularmente

---

## 🆘 Troubleshooting

### Variável não está sendo lida no frontend

- Certifique-se de que a variável começa com `VITE_`
- Rebuild o projeto após adicionar novas variáveis
- Verifique se o nome está correto (case-sensitive)

### Variável não está sendo lida no backend

- Reinicie o servidor após adicionar variáveis
- Verifique se não há prefixo `VITE_` (backend não usa esse prefixo)
- Verifique se o arquivo `.env` está na raiz do projeto

### Erro de CORS

- Verifique se `CORS_ORIGIN` está configurado corretamente
- Certifique-se de incluir o protocolo (https://)
- Separe múltiplos domínios por vírgula

### Erro de conexão com banco de dados

- Verifique se a string `DATABASE_URL` está entre aspas
- Teste a conexão com o banco de dados
- Verifique se as credenciais estão corretas
- Certifique-se de que o banco de dados está acessível

---

## 📞 Suporte

Se tiver dúvidas sobre a configuração, consulte:
- `ENV_VARIABLES.md` - Documentação detalhada de todas as variáveis
- `DEPLOY.md` - Guia de deploy por plataforma

