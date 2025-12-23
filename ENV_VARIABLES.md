# 🔐 Variáveis de Ambiente - PloutosLedger

Documentação completa de todas as variáveis de ambiente utilizadas no projeto.

## 📋 Variáveis Obrigatórias

### Ambiente
```env
NODE_ENV=production
# Opções: development, production, test
```

### API e Backend
```env
VITE_API_URL=https://api.seudominio.com
# URL base da API backend

VITE_API_BASE_URL=https://api.seudominio.com
# URL alternativa para API (fallback)
```

### Banco de Dados
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ploutosledger"
# String de conexão do banco de dados
# Formatos suportados:
# - SQLite: file:./prisma/dev.db
# - PostgreSQL: postgresql://user:password@host:port/database
# - MySQL: mysql://user:password@host:port/database
```

### Segurança
```env
JWT_SECRET=seu-jwt-secret-super-seguro-aqui
# Secret para assinatura de tokens JWT
# IMPORTANTE: Use um valor aleatório e seguro em produção

JWT_EXPIRES_IN=7d
# Tempo de expiração dos tokens JWT
# Formatos: 1h, 7d, 30d, etc.

SESSION_SECRET=seu-session-secret-aqui
# Secret para sessões
# IMPORTANTE: Use um valor aleatório e seguro em produção
```

## 📋 Variáveis Opcionais

### Domínio e Protocolo
```env
VITE_APP_DOMAIN=seudominio.com
# Domínio da aplicação

VITE_APP_PROTOCOL=https
# Protocolo (http ou https)
# Em produção, sempre use https
```

### Portas
```env
PORT=4000
# Porta do servidor backend

VITE_PORT=5173
# Porta do servidor de desenvolvimento (Vite)
```

### Logs e Debug
```env
VITE_LOG_LEVEL=info
# Nível de log
# Opções: debug, info, warn, error

DEBUG=false
# Ativar modo debug
# true ou false
```

### Integrações Externas

#### WhatsApp/CallMeBot
```env
VITE_CALLMEBOT_API_KEY=sua-chave-api
# Chave da API CallMeBot

VITE_ADMIN_PHONE=5511984801839
# Telefone do administrador (formato internacional)
```

#### Email (SMTP)
```env
SMTP_HOST=smtp.gmail.com
# Servidor SMTP

SMTP_PORT=587
# Porta SMTP

SMTP_USER=seu-email@gmail.com
# Usuário SMTP

SMTP_PASS=sua-senha
# Senha SMTP

SMTP_FROM=noreply@ploutosledger.com
# Email remetente
```

#### Pagamento (PIX)
```env
PIX_API_KEY=sua-chave-pix
# Chave da API de pagamento PIX

PIX_API_URL=https://api.pix.example.com
# URL da API de pagamento
```

### Recursos Opcionais
```env
ENABLE_ANALYTICS=true
# Ativar analytics
# true ou false

ENABLE_CHAT=true
# Ativar sistema de chat
# true ou false

ENABLE_NOTIFICATIONS=true
# Ativar notificações
# true ou false

ENABLE_BACKUP=true
# Ativar sistema de backup
# true ou false
```

### Performance
```env
ENABLE_CACHE=true
# Ativar cache
# true ou false

CACHE_TTL=3600
# Tempo de vida do cache (em segundos)

MAX_CACHE_SIZE=100
# Tamanho máximo do cache (em MB)
```

## 🌐 Variáveis por Plataforma de Deploy

### Vercel
```env
VERCEL_URL=seu-app.vercel.app
# URL automática fornecida pela Vercel
```

### Netlify
```env
NETLIFY_URL=seu-app.netlify.app
# URL automática fornecida pela Netlify
```

### Railway
```env
RAILWAY_URL=seu-app.railway.app
# URL automática fornecida pela Railway
```

### Render
```env
RENDER_URL=seu-app.onrender.com
# URL automática fornecida pelo Render
```

## 🔧 Configuração por Ambiente

### Desenvolvimento
```env
NODE_ENV=development
VITE_API_URL=http://localhost:4000
VITE_APP_DOMAIN=localhost
VITE_APP_PROTOCOL=http
VITE_LOG_LEVEL=debug
DEBUG=true
```

### Produção
```env
NODE_ENV=production
VITE_API_URL=https://api.seudominio.com
VITE_APP_DOMAIN=seudominio.com
VITE_APP_PROTOCOL=https
VITE_LOG_LEVEL=info
DEBUG=false
```

### Teste
```env
NODE_ENV=test
VITE_API_URL=http://localhost:4000
VITE_LOG_LEVEL=error
DEBUG=false
```

## 🔒 Segurança

### Boas Práticas

1. **Nunca commite `.env` no Git**
   - Adicione `.env` ao `.gitignore`
   - Use `.env.example` como template

2. **Use secrets fortes**
   - JWT_SECRET: mínimo 32 caracteres aleatórios
   - SESSION_SECRET: mínimo 32 caracteres aleatórios
   - Use geradores de secrets: `openssl rand -base64 32`

3. **Rotacione secrets regularmente**
   - Mude secrets a cada 90 dias
   - Notifique usuários antes de rotacionar

4. **Use variáveis de ambiente do provedor**
   - Não hardcode secrets no código
   - Use painel do provedor para configurar

## 📝 Exemplo de .env

```env
# ============================================
# PloutosLedger - Configuração de Produção
# ============================================

# Ambiente
NODE_ENV=production

# API
VITE_API_URL=https://api.ploutosledger.com
VITE_API_BASE_URL=https://api.ploutosledger.com

# Domínio
VITE_APP_DOMAIN=ploutosledger.com
VITE_APP_PROTOCOL=https

# Banco de Dados
DATABASE_URL="postgresql://ploutos:senha_segura@db.ploutosledger.com:5432/ploutosledger"

# Segurança
JWT_SECRET=seu-jwt-secret-super-seguro-de-32-caracteres-minimo
JWT_EXPIRES_IN=7d
SESSION_SECRET=seu-session-secret-super-seguro-de-32-caracteres-minimo

# Portas
PORT=4000

# Logs
VITE_LOG_LEVEL=info

# Integrações
VITE_CALLMEBOT_API_KEY=sua-chave
VITE_ADMIN_PHONE=5511984801839

# Recursos
ENABLE_ANALYTICS=true
ENABLE_CHAT=true
ENABLE_NOTIFICATIONS=true
ENABLE_BACKUP=true

# Performance
ENABLE_CACHE=true
CACHE_TTL=3600
MAX_CACHE_SIZE=100
```

## 🆘 Troubleshooting

### Variável não está sendo lida

1. Verifique se o nome está correto (case-sensitive)
2. Verifique se está no formato `VITE_*` para variáveis do frontend
3. Reinicie o servidor após adicionar variáveis
4. Verifique se o arquivo `.env` está na raiz do projeto

### Variável não disponível no frontend

- Variáveis do frontend devem começar com `VITE_`
- Use `import.meta.env.VITE_NOME_VARIAVEL`
- Rebuild necessário após adicionar novas variáveis

### Variável não disponível no backend

- Variáveis do backend usam `process.env.NOME_VARIAVEL`
- Não precisam do prefixo `VITE_`
- Reinicie o servidor após adicionar

