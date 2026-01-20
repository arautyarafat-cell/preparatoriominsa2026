import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      // Otimizações de build para produção
      sourcemap: false, // Desativar sourcemaps em produção por segurança
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProduction, // Remover console.log em produção
          drop_debugger: true
        }
      },
      rollupOptions: {
        output: {
          // Separar vendors para melhor caching
          manualChunks: {
            vendor: ['react', 'react-dom'],
            supabase: ['@supabase/supabase-js'],
            charts: ['recharts']
          }
        }
      },
      // Avisar se chunks forem muito grandes
      chunkSizeWarningLimit: 1000
    },
    // Preview server (para testar build localmente)
    preview: {
      port: 4173,
      host: '0.0.0.0'
    }
  };
});
