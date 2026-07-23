import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      // Forward Netlify Function requests to the local functions server
      '/.netlify/functions': {
        target: 'http://localhost:9999',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router'],
          query: ['@tanstack/react-query'],
          charts: ['lightweight-charts'],
          motion: ['framer-motion'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});