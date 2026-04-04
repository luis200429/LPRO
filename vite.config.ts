
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';


// SUSTITUYE ESTA IP POR LA DE TU SERVIDOR (ej: '192.168.1.50' o '34.23.12.1')
const BACKEND_IP = 'localhost'; 
const BACKEND_PORT = '3002';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    preprocessorOptions: {}
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    allowedHosts: ['augacalidade.duckdns.org'],
    proxy: {
      '/api': {
        target: process.env.DOCKER ? 'http://api:3002' : 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: process.env.DOCKER ? 'http://api:3002' : 'http://localhost:3002',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
