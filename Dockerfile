# ============================================
# PLOUTOS LEDGER - Dockerfile para Produção
# ============================================

# Estágio 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --only=production=false

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Build do frontend
RUN npm run build

# Build do servidor backend
RUN npm run server:build

# Estágio 2: Produção
FROM node:18-alpine AS production

WORKDIR /app

# Instalar Prisma CLI e dependências de produção
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npm install -g prisma && \
    npx prisma generate

# Copiar arquivos compilados do builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/public ./public

# Criar diretório para logs e dados
RUN mkdir -p logs prisma/data

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Expor porta
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicialização
CMD ["sh", "-c", "npx prisma migrate deploy && node dist-server/index.js"]

