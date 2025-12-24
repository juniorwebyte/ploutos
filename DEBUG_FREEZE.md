# 🔍 Guia de Diagnóstico - Site Travado na Tela de Loading

Este guia ajuda a diagnosticar e resolver o problema de travamento na tela de loading.

## ✅ Correções Aplicadas

1. **useVisualConfig**: Proteção contra erros ao acessar localStorage
2. **App.tsx**: Removida chamada duplicada de carregarConfiguracoesVisuais
3. **App.tsx**: Proteção no useEffect do handler de demo
4. **main.tsx**: Timeout de segurança de 10 segundos
5. **main.tsx**: Melhor tratamento de erros na inicialização

## 🔍 Como Diagnosticar

### 1. Abrir o Console do Navegador

1. Abra o site no navegador
2. Pressione `F12` ou `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
3. Vá na aba "Console"
4. Procure por erros em vermelho

### 2. Verificar Erros Comuns

#### Erro: "Failed to fetch" ou "Network Error"
- **Causa**: Backend não está rodando ou URL da API incorreta
- **Solução**: Verifique se `VITE_API_URL` está configurada corretamente na Vercel

#### Erro: "Cannot read property 'X' of undefined"
- **Causa**: Variável de ambiente não configurada
- **Solução**: Verifique todas as variáveis `VITE_*` na Vercel

#### Erro: "ChunkLoadError" ou "Loading chunk X failed"
- **Causa**: Arquivo JavaScript não encontrado (problema de build)
- **Solução**: Faça um novo deploy ou limpe o cache do navegador

#### Erro: "localStorage is not defined"
- **Causa**: Código tentando acessar localStorage no servidor (SSR)
- **Solução**: Já corrigido, mas se aparecer, pode indicar outro problema

### 3. Verificar Variáveis de Ambiente na Vercel

No painel da Vercel, verifique se estas variáveis estão configuradas:

**Obrigatórias:**
- `VITE_API_URL` - URL do seu backend
- `VITE_API_BASE_URL` - URL do backend (pode ser igual ao anterior)

**Opcionais (mas recomendadas):**
- `VITE_APP_DOMAIN` - Seu domínio
- `VITE_APP_PROTOCOL` - https
- `VITE_LOG_LEVEL` - info

### 4. Verificar Network Tab

1. Abra as ferramentas de desenvolvedor (F12)
2. Vá na aba "Network" (Rede)
3. Recarregue a página
4. Procure por requisições que falharam (vermelho)
5. Verifique especialmente:
   - Requisições para `/api/`
   - Carregamento de chunks JavaScript
   - Carregamento de assets (CSS, imagens)

### 5. Verificar Build Logs na Vercel

1. Vá no painel da Vercel
2. Abra o projeto
3. Vá em "Deployments"
4. Clique no último deploy
5. Verifique se houve erros durante o build

## 🛠️ Soluções Rápidas

### Solução 1: Limpar Cache do Navegador

1. Pressione `Ctrl+Shift+Delete` (Windows) / `Cmd+Shift+Delete` (Mac)
2. Selecione "Cache" e "Cookies"
3. Limpe tudo
4. Recarregue a página

### Solução 2: Verificar Variáveis de Ambiente

1. Vá no painel da Vercel
2. Settings > Environment Variables
3. Verifique se todas as variáveis `VITE_*` necessárias estão configuradas
4. Faça um novo deploy após alterar

### Solução 3: Rebuild Completo

1. Vá no painel da Vercel
2. Deployments
3. Clique nos 3 pontos do último deploy
4. "Redeploy"
5. Aguarde o deploy completar

### Solução 4: Verificar Console do Navegador

Abra o console (F12) e execute:

```javascript
// Verificar se o React carregou
console.log('React:', typeof React !== 'undefined' ? 'OK' : 'ERRO');

// Verificar variáveis de ambiente
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Modo:', import.meta.env.MODE);
console.log('DEV:', import.meta.env.DEV);

// Verificar localStorage
console.log('localStorage:', typeof localStorage !== 'undefined' ? 'OK' : 'ERRO');
```

## 📋 Checklist de Diagnóstico

- [ ] Console do navegador não mostra erros?
- [ ] Todas as variáveis `VITE_*` estão configuradas na Vercel?
- [ ] Build na Vercel completou sem erros?
- [ ] Network tab não mostra requisições falhando?
- [ ] Cache do navegador foi limpo?
- [ ] Tentou em modo anônimo/privado?

## 🚨 Se Nada Funcionar

1. **Capture o erro exato do console** e compartilhe
2. **Verifique os logs de build** na Vercel
3. **Tente acessar diretamente** algum endpoint da API
4. **Verifique se o backend está rodando** (se aplicável)

## 📝 Informações para Depuração

Execute no console do navegador e compartilhe os resultados:

```javascript
// Informações do ambiente
const debugInfo = {
  userAgent: navigator.userAgent,
  url: window.location.href,
  env: {
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  },
  localStorage: typeof localStorage !== 'undefined',
  documentReady: document.readyState,
  rootElement: !!document.getElementById('root'),
};

console.table(debugInfo);
```

