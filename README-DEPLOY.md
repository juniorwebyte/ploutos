# 🚀 PloutosLedger - Guia Rápido de Deploy

## ⚡ Deploy Rápido

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/ploutos-ledger.git
cd ploutos-ledger
```

### 2. Configure Variáveis de Ambiente
```bash
cp env.example .env
# Edite o .env com suas configurações
```

### 3. Instale Dependências
```bash
npm install
```

### 4. Configure o Banco de Dados

**SQLite (Desenvolvimento):**
```bash
export DATABASE_PROVIDER=sqlite
export DATABASE_URL="file:./prisma/dev.db"
```

**PostgreSQL (Produção):**
```bash
export DATABASE_PROVIDER=postgresql
export DATABASE_URL="postgresql://usuario:senha@localhost:5432/ploutosledger?schema=public"
```

### 5. Gere o Prisma Client
```bash
npx prisma generate
```

### 6. Execute Migrações
```bash
npx prisma migrate deploy
```

### 7. Build da Aplicação
```bash
npm run build
npm run server:build
```

### 8. Inicie a Aplicação

**Desenvolvimento:**
```bash
npm run dev
```

**Produção (PM2):**
```bash
npm run start:prod
```

**Produção (Docker):**
```bash
docker-compose up -d
```

---

## 📋 Plataformas Suportadas

- ✅ **VPS Tradicional** (Ubuntu/Debian)
- ✅ **Bolt.new** (Full-stack)
- ✅ **Docker** (Containers)
- ✅ **Railway** (Full-stack)
- ✅ **Render** (Full-stack)
- ✅ **Hospedagens Web Tradicionais** (cPanel/FTP)

---

## 📚 Documentação Completa

Para instruções detalhadas, consulte: [DEPLOY.md](./DEPLOY.md)

---

## 🔐 Variáveis de Ambiente Essenciais

```env
NODE_ENV=production
PORT=4000
DATABASE_URL="sua-url-de-banco"
JWT_SECRET="sua-chave-secreta-forte"
CORS_ORIGIN="https://seu-dominio.com"
```

---

## ⚠️ Importante

1. **NUNCA** commite o arquivo `.env`
2. **SEMPRE** gere um `JWT_SECRET` forte para produção
3. **USE** PostgreSQL ou MySQL em produção (não SQLite)
4. **CONFIGURE** SSL/HTTPS em produção
5. **CONFIGURE** backups regulares do banco de dados

---

## 🆘 Problemas Comuns

### Erro de Conexão com Banco
```bash
# Verificar URL do banco
echo $DATABASE_URL

# Testar conexão Prisma
npx prisma db pull
```

### Porta em Uso
```bash
# Parar processo na porta 4000
lsof -ti:4000 | xargs kill
# ou
pkill -f "node.*4000"
```

### Prisma Client não gerado
```bash
npx prisma generate
```

---

## 📞 Suporte

Para ajuda adicional:
- 📧 Email: suporte@webyte.com
- 📖 Documentação: [DEPLOY.md](./DEPLOY.md)

