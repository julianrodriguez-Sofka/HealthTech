import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types')
    }
  },
  server: {
    port: 3003,
    host: '0.0.0.0',
    strictPort: true,
    watch: {
      usePolling: true
    },
    proxy: {
      '/api': {
        target: process.env.DOCKER_ENV === 'true' ? 'http://app:3000' : 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
        }
      },
      '/socket.io': {
        target: process.env.DOCKER_ENV === 'true' ? 'http://app:3000' : 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('WebSocket proxy error:', err);
          });
        }
      }
    }
  }
});
