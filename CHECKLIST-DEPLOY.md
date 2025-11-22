# ✅ Checklist de Deploy - PloutosLedger

Use este checklist para garantir que seu deploy está completo e funcional.

## 🔧 Pré-Deploy

### Configuração Inicial
- [ ] Repositório clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` criado a partir de `env.example`
- [ ] Todas as variáveis de ambiente configuradas

### Variáveis de Ambiente Essenciais
- [ ] `NODE_ENV=production`
- [ ] `PORT` configurado (padrão: 4000)
- [ ] `DATABASE_URL` configurado
- [ ] `DATABASE_PROVIDER` configurado (sqlite/postgresql/mysql)
- [ ] `JWT_SECRET` gerado e configurado (chave forte!)
- [ ] `CORS_ORIGIN` configurado corretamente
- [ ] `VITE_API_BASE_URL` configurado (se frontend separado)

### Banco de Dados
- [ ] Banco de dados criado e acessível
- [ ] Prisma Client gerado (`npx prisma generate`)
- [ ] Migrações executadas (`npx prisma migrate deploy`)
- [ ] Conexão testada (`npx prisma db pull`)

### Build
- [ ] Frontend buildado (`npm run build`)
- [ ] Backend buildado (`npm run server:build`)
- [ ] Arquivos gerados em `dist/` e `dist-server/`
- [ ] Sem erros de compilação

## 🚀 Deploy

### VPS Tradicional
- [ ] Node.js 18+ instalado
- [ ] PM2 instalado e configurado
- [ ] Nginx instalado e configurado
- [ ] Script `deploy-vps.sh` executado (ou configuração manual)
- [ ] Serviço PM2 iniciado
- [ ] Nginx configurado e rodando
- [ ] Firewall configurado (UFW)

### Docker
- [ ] Docker instalado
- [ ] Docker Compose instalado
- [ ] Arquivo `.env` configurado
- [ ] Containers buildados (`docker-compose build`)
- [ ] Containers iniciados (`docker-compose up -d`)
- [ ] Logs verificados (`docker-compose logs`)

### Railway/Render
- [ ] Conta criada na plataforma
- [ ] Projeto criado
- [ ] Repositório conectado
- [ ] Variáveis de ambiente configuradas
- [ ] Build configurado corretamente
- [ ] Deploy automático ativado

### Bolt.new
- [ ] Conta Bolt.new criada
- [ ] Repositório conectado
- [ ] Arquivo `bolt.json` verificado
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy executado

### Hospedagens Web Tradicionais
- [ ] Acesso FTP/cPanel configurado
- [ ] Node.js disponível na hospedagem
- [ ] Build da aplicação executado
- [ ] Arquivos enviados via FTP/cPanel
- [ ] Variáveis de ambiente configuradas
- [ ] Aplicação iniciada no painel

## 🔒 Segurança

### Produção
- [ ] `JWT_SECRET` forte e único configurado
- [ ] `CORS_ORIGIN` configurado (não usar `*` em produção)
- [ ] SSL/HTTPS configurado
- [ ] Firewall configurado
- [ ] Senhas de banco de dados fortes
- [ ] Arquivo `.env` não commitado no Git

### Headers de Segurança
- [ ] X-Frame-Options configurado
- [ ] X-Content-Type-Options configurado
- [ ] X-XSS-Protection configurado
- [ ] Content-Security-Policy configurado (opcional)

## 📊 Verificação Pós-Deploy

### Saúde da Aplicação
- [ ] Health check funcionando (`/health`)
- [ ] API respondendo corretamente
- [ ] Frontend carregando
- [ ] Sem erros no console do navegador
- [ ] Sem erros nos logs do servidor

### Funcionalidades
- [ ] Login funcionando
- [ ] Autenticação JWT funcionando
- [ ] Banco de dados acessível
- [ ] APIs respondendo
- [ ] Frontend conectado ao backend

### Performance
- [ ] Tempo de resposta < 500ms
- [ ] Página carregando em < 3s
- [ ] Assets sendo servidos com cache
- [ ] Gzip/Brotli habilitado (se aplicável)

### Monitoramento
- [ ] Logs configurados e acessíveis
- [ ] Monitoramento de uptime configurado (opcional)
- [ ] Alertas configurados (opcional)

## 💾 Backup

### Configuração de Backup
- [ ] Script de backup criado (`scripts/backup-db.sh`)
- [ ] Backup automático configurado (cron/systemd timer)
- [ ] Retenção de backups configurada
- [ ] Backup testado e restaurado com sucesso

## 🔄 Manutenção

### Atualizações
- [ ] Processo de atualização documentado
- [ ] Script de atualização testado
- [ ] Rollback plan preparado

### Logs
- [ ] Logs configurados
- [ ] Rotação de logs configurada
- [ ] Acesso aos logs configurado

## 📝 Documentação

### Documentação Técnica
- [ ] `DEPLOY.md` lido e compreendido
- [ ] `README-DEPLOY.md` revisado
- [ ] Variáveis de ambiente documentadas
- [ ] Processo de deploy documentado

## ✅ Validação Final

### Testes
- [ ] Todos os endpoints testados
- [ ] Fluxos principais testados
- [ ] Testes de carga básicos (opcional)
- [ ] Testes de segurança básicos

### Documentação
- [ ] Documentação atualizada
- [ ] Credenciais documentadas (armazenadas com segurança)
- [ ] Contatos de suporte documentados

---

## 🎯 Próximos Passos

Após completar o checklist:

1. **Monitoramento**: Configure monitoramento contínuo
2. **Backups**: Configure backups automáticos
3. **CI/CD**: Configure deploy automático (opcional)
4. **Documentação**: Mantenha documentação atualizada
5. **Segurança**: Realize auditorias periódicas

---

## 🆘 Em Caso de Problemas

Consulte:
- [DEPLOY.md](./DEPLOY.md) - Guia completo de deploy
- [README-DEPLOY.md](./README-DEPLOY.md) - Guia rápido
- Seção Troubleshooting em DEPLOY.md

---

**Última atualização:** 2024

