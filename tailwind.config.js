/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Ativar dark mode via classe
  theme: {
    extend: {
      // Otimizações de performance
      transitionProperty: {
        'transform-opacity': 'transform, opacity',
      },
      // Animações otimizadas
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
  // Otimizações de produção
  corePlugins: {
    // Desabilitar features não usadas em produção
    preflight: true,
  },
};
