# 🚀 Guia de Deploy no Vercel - PloutosLedger

Este documento contém todas as informações necessárias para fazer o deploy do PloutosLedger na Vercel.

## 📄 Configuração do Vercel (vercel.json)

O arquivo `vercel.json` já está configurado com:

- **Framework**: Vite (detectado automaticamente)
- **Output Directory**: `dist`
- **Build Command**: `npm run build`
- **SPA Routing**: Configurado com rewrite para `/index.html`
- **Cache**: Assets com cache de 1 ano

## 📦 Scripts de Build

Os scripts necessários já estão configurados no `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:prod": "cross-env NODE_ENV=production tsc && vite build",
    "preview": "vite preview"
  }
}
```

## ⚙️ Variáveis de Ambiente Necessárias

### Frontend (VITE_*)

Configure estas variáveis no painel do Vercel (Settings > Environment Variables):

```
VITE_API_BASE_URL=https://seu-projeto.vercel.app/api
VITE_API_URL=https://seu-projeto.vercel.app/api
VITE_APP_DOMAIN=seu-projeto.vercel.app
VITE_APP_PROTOCOL=https
VITE_APP_TITLE=PloutosLedger
VITE_APP_VERSION=3.0.0
```

### Backend (se usar Serverless Functions)

```
NODE_ENV=production
DATABASE_URL=postgresql://usuario:senha@host:porta/database
JWT_SECRET=GERE_UMA_CHAVE_SEGURA_AQUI
CORS_ORIGIN=https://seu-projeto.vercel.app
CALLMEBOT_API_KEY=sua_chave
ADMIN_PHONE=+5511999999999
```

### Como Gerar JWT_SECRET

Execute no terminal:

```bash
openssl rand -base64 32
```

Ou use um gerador online seguro.

## 🔧 Configurações do Vite

O projeto usa Vite com React. A configuração completa está em `vite.config.ts` e inclui:

- ✅ Plugin React
- ✅ Otimizações de build
- ✅ Code splitting
- ✅ Chunking strategy otimizado
- ✅ Cache de dependências

## 📝 Passo a Passo para Deploy

### 1. Preparação

1. Certifique-se de que todas as dependências estão no `package.json`
2. Teste o build localmente: `npm run build`
3. Verifique se a pasta `dist` foi criada corretamente

### 2. Conectar ao Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub/GitLab/Bitbucket
3. Clique em "Add New Project"
4. Importe o repositório do PloutosLedger

### 3. Configurar Variáveis de Ambiente

1. No painel do projeto, vá em **Settings > Environment Variables**
2. Adicione todas as variáveis listadas acima
3. Certifique-se de marcar para quais ambientes aplicar (Production, Preview, Development)

### 4. Configurar Build

O Vercel detectará automaticamente:
- ✅ Framework: Vite
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `dist`
- ✅ Install Command: `npm install`

### 5. Deploy

1. Clique em **Deploy**
2. Aguarde o build completar
3. Acesse a URL fornecida pelo Vercel

## 🎯 Configurações Adicionais Recomendadas

### Domínio Personalizado

1. Vá em **Settings > Domains**
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme instruções

### Branch Protection

1. Vá em **Settings > Git**
2. Configure branch protection para produção
3. Defina qual branch será usado para deploy automático

### Preview Deployments

O Vercel automaticamente cria preview deployments para cada Pull Request, permitindo testar mudanças antes de fazer merge.

## 🔍 Troubleshooting

### Build Falha

1. Verifique os logs de build no painel do Vercel
2. Teste o build localmente: `npm run build`
3. Verifique se todas as dependências estão no `package.json`

### Variáveis de Ambiente Não Funcionam

1. Certifique-se de que as variáveis começam com `VITE_` para serem expostas ao frontend
2. Verifique se as variáveis estão configuradas para o ambiente correto
3. Faça um novo deploy após adicionar variáveis

### Roteamento SPA Não Funciona

1. Verifique se o `vercel.json` está na raiz do projeto
2. Confirme que o rewrite está configurado corretamente
3. Verifique se o `index.html` está no diretório `dist`

### Assets Não Carregam

1. Verifique se os caminhos dos assets estão corretos
2. Confirme que o cache está configurado no `vercel.json`
3. Verifique os headers de Cache-Control

## 📚 Recursos Adicionais

- [Documentação Vercel](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Environment Variables no Vercel](https://vercel.com/docs/environment-variables)

## ✅ Checklist de Deploy

- [ ] Build local funciona (`npm run build`)
- [ ] Todas as variáveis de ambiente configuradas
- [ ] `vercel.json` está na raiz do projeto
- [ ] Repositório conectado ao Vercel
- [ ] Domínio configurado (se aplicável)
- [ ] Teste de deploy bem-sucedido
- [ ] Verificação de funcionalidades após deploy

---

**Nota**: Este guia assume que você está usando apenas o frontend. Se precisar de serverless functions, consulte a [documentação do Vercel sobre Serverless Functions](https://vercel.com/docs/functions).

