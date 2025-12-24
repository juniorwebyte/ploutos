import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Ativar Fast Refresh otimizado
      fastRefresh: true,
      // Incluir apenas arquivos necessários
      include: '**/*.{jsx,tsx}',
    }),
  ],
  build: {
    // Otimizações de build para melhor performance
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Chunking strategy simplificado para evitar problemas de inicialização
        manualChunks: (id) => {
          // Manter React/React-DOM/React-Router juntos (importante!)
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              // Manter tudo relacionado ao React junto para evitar problemas de inicialização
              return 'react-vendor';
            }
            // Separar outras dependências grandes
            if (id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            if (id.includes('axios')) {
              return 'axios-vendor';
            }
            // Outras dependências menores juntas
            return 'vendor';
          }
        },
        // Otimização de nomes de arquivos
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Limite de avisos de chunk size
    chunkSizeWarningLimit: 1000,
    // Otimizações adicionais
    reportCompressedSize: false,
    emptyOutDir: true,
    // Aumentar limite de chunk size para evitar divisões desnecessárias
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    // Incluir dependências que precisam ser pré-empacotadas
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-router-dom',
      'axios',
      'zod'
    ],
    // Forçar re-otimização se necessário
    force: false,
  },
  server: {
    // Otimizações do servidor de desenvolvimento
    hmr: {
      overlay: true,
    },
    // Pré-requisições para melhor performance
    preTransformRequests: true,
  },
  // Cache para melhor performance de rebuild
  cacheDir: 'node_modules/.vite',
});
