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
    minify: process.env.NODE_ENV === 'production' ? 'esbuild' : false,
    sourcemap: process.env.NODE_ENV === 'production' ? false : true,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Chunking strategy otimizado
        manualChunks: (id) => {
          // Separar node_modules em chunks específicos
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            if (id.includes('axios') || id.includes('zod')) {
              return 'utils-vendor';
            }
            if (id.includes('@prisma')) {
              return 'prisma-vendor';
            }
            return 'vendor';
          }
          
          // Separar componentes grandes em chunks próprios
          if (id.includes('src/components')) {
            if (id.includes('PDVSystemNew') || id.includes('PDVSystem')) {
              return 'pdv-chunk';
            }
            if (id.includes('SuperAdminDashboard') || id.includes('ClientDashboard')) {
              return 'dashboard-chunk';
            }
            if (id.includes('LandingPage')) {
              return 'landing-chunk';
            }
            if (id.includes('CashFlow')) {
              return 'cashflow-chunk';
            }
            if (id.includes('AdminPanel')) {
              return 'admin-chunk';
            }
            // Outros componentes em chunk separado
            return 'components-chunk';
          }
          
          // Separar serviços em chunk próprio
          if (id.includes('src/services')) {
            return 'services-chunk';
          }
          
          // Separar utils em chunk próprio
          if (id.includes('src/utils')) {
            return 'utils-chunk';
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
  },
  optimizeDeps: {
    // Incluir dependências que precisam ser pré-empacotadas
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'zod'],
    // Excluir lucide-react do pré-empacotamento (será carregado sob demanda)
    exclude: ['lucide-react'],
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
