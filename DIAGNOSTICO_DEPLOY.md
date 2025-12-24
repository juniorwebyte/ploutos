# 🔍 Diagnóstico - Site Travado no Deploy

## ⚠️ Problema
Aplicação funciona localmente mas trava na tela de loading após deploy.

## 🔧 Correções Aplicadas

1. ✅ Proteção no `AuthContext` - tratamento assíncrono seguro de sessão
2. ✅ Timeout em lazy loading de componentes (10s)
3. ✅ Handlers globais de erro no `main.tsx`
4. ✅ Melhor tratamento de erros em todos os hooks
5. ✅ Utilitário de debug que loga informações de ambiente

## 📋 Checklist de Diagnóstico RÁPIDO

### Passo 1: Verificar Console do Navegador

1. Acesse o site no deploy
2. Pressione **F12** para abrir DevTools
3. Vá na aba **Console**
4. Procure por erros em **vermelho**

**Erros mais comuns:**
- `ChunkLoadError` → Problema com code splitting
- `Failed to fetch` → Backend não acessível
- `undefined is not a function` → Erro de JavaScript
- `Cannot read property 'X' of undefined` → Variável não definida

### Passo 2: Verificar Variáveis de Ambiente na Vercel

**CRÍTICO:** A causa mais comum é variáveis de ambiente não configuradas!

No painel da Vercel:
1. Vá em **Settings** > **Environment Variables**
2. Verifique se estas variáveis estão configuradas:

```
VITE_API_URL=https://sua-api.com (ou URL do backend)
VITE_API_BASE_URL=https://sua-api.com (mesmo valor)
```

**Se essas variáveis não estiverem configuradas, a aplicação VAI TRAVAR!**

### Passo 3: Executar Script de Diagnóstico

Abra o console (F12) e execute:

```javascript
// Copie e cole este código no console
(async function diagnostico() {
  console.log('🔍 Iniciando diagnóstico...\n');
  
  // 1. Verificar ambiente
  console.log('1️⃣ Variáveis de Ambiente:');
  console.log('   VITE_API_URL:', import.meta.env.VITE_API_URL || '❌ NÃO CONFIGURADO');
  console.log('   VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || '❌ NÃO CONFIGURADO');
  console.log('   MODE:', import.meta.env.MODE);
  console.log('   PROD:', import.meta.env.PROD);
  
  // 2. Verificar elementos DOM
  console.log('\n2️⃣ DOM:');
  console.log('   Root element:', document.getElementById('root') ? '✅ Encontrado' : '❌ Não encontrado');
  console.log('   Body:', document.body ? '✅ Existe' : '❌ Não existe');
  
  // 3. Verificar localStorage
  console.log('\n3️⃣ LocalStorage:');
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('   Status: ✅ Funcionando');
  } catch (e) {
    console.log('   Status: ❌ Erro -', e.message);
  }
  
  // 4. Testar fetch (se API_URL estiver configurada)
  if (import.meta.env.VITE_API_URL) {
    console.log('\n4️⃣ Teste de Conexão com Backend:');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      console.log('   Status:', response.ok ? '✅ Backend acessível' : '❌ Backend retornou erro');
    } catch (e) {
      console.log('   Status: ❌ Backend não acessível -', e.message);
    }
  } else {
    console.log('\n4️⃣ Teste de Conexão: ⚠️ VITE_API_URL não configurada, pulando teste');
  }
  
  // 5. Verificar React
  console.log('\n5️⃣ React:');
  const reactCheck = document.querySelector('[data-reactroot], #root') || 
                     (window as any).React ? '✅ Carregado' : '⚠️ Não detectado';
  console.log('   Status:', reactCheck);
  
  // 6. Verificar erros não tratados
  console.log('\n6️⃣ Erros:');
  console.log('   Verifique a aba Console acima para erros específicos');
  
  console.log('\n✅ Diagnóstico completo!');
  console.log('\n📝 Se VITE_API_URL ou VITE_API_BASE_URL mostraram "NÃO CONFIGURADO":');
  console.log('   1. Vá no painel da Vercel');
  console.log('   2. Settings > Environment Variables');
  console.log('   3. Adicione VITE_API_URL e VITE_API_BASE_URL');
  console.log('   4. Faça um novo deploy');
})();
```

### Passo 4: Verificar Network Tab

1. Abra DevTools (F12)
2. Vá na aba **Network**
3. Recarregue a página
4. Procure por:
   - Arquivos `.js` que falharam (vermelho)
   - Requisições para `/api/` que falharam
   - Tempo de carregamento muito alto

## 🛠️ Soluções por Tipo de Erro

### Erro: "VITE_API_URL não configurada"

**Solução:**
1. Vá no painel da Vercel
2. Settings > Environment Variables
3. Adicione:
   ```
   VITE_API_URL=https://sua-api-backend.com
   VITE_API_BASE_URL=https://sua-api-backend.com
   ```
4. Faça um novo deploy

### Erro: "ChunkLoadError" ou "Loading chunk failed"

**Causa:** Arquivo JavaScript não encontrado após build

**Soluções:**
1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Fazer um novo deploy na Vercel
3. Verificar se o build completou sem erros

### Erro: "Failed to fetch" ou "Network Error"

**Causa:** Backend não está acessível ou URL incorreta

**Soluções:**
1. Verificar se o backend está rodando
2. Verificar se a URL em `VITE_API_URL` está correta
3. Verificar CORS no backend
4. Testar a URL diretamente no navegador

### Nenhum erro visível, mas trava mesmo assim

**Possíveis causas:**
1. Loop infinito em algum useEffect
2. Promise que nunca resolve
3. Componente que não renderiza

**Soluções:**
1. Verificar a aba "Performance" no DevTools
2. Verificar se há loops de renderização
3. Adicionar console.log em pontos críticos

## 📝 Configuração Mínima para Funcionar

Para a aplicação funcionar, você **DEVE** ter no mínimo:

### Na Vercel (Environment Variables):

```
VITE_API_URL=https://seu-backend.com
VITE_API_BASE_URL=https://seu-backend.com
```

**IMPORTANTE:** Se você não tem backend, pode usar um placeholder temporário:
```
VITE_API_URL=https://httpbin.org/get
VITE_API_BASE_URL=https://httpbin.org/get
```

Mas isso é apenas para testar se o problema é a falta de variáveis. Você precisará configurar um backend real depois.

## 🚨 Teste Rápido

Execute este comando no console do navegador quando o site estiver travado:

```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
```

Se mostrar `undefined`, esse é o problema! Configure as variáveis na Vercel.

## ✅ Checklist Final

Antes de fazer deploy, verifique:

- [ ] Variáveis `VITE_API_URL` e `VITE_API_BASE_URL` configuradas na Vercel
- [ ] Build na Vercel completou sem erros
- [ ] Testou localmente com `npm run build && npm run preview`
- [ ] Console do navegador não mostra erros críticos
- [ ] Network tab mostra todos os arquivos carregando corretamente

## 📞 Ainda com Problemas?

Se após seguir todos os passos o problema persistir, compartilhe:

1. **Screenshot do console** com os erros
2. **Screenshot das Environment Variables** na Vercel (oculte valores sensíveis)
3. **Resultado do script de diagnóstico** acima
4. **Logs de build** da Vercel (se houver erros)

