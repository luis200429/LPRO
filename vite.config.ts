
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// SUSTITUYE ESTA IP POR LA DE TU SERVIDOR (ej: '192.168.1.50' o '34.23.12.1')
const BACKEND_IP = '34.73.211.235'; 
const BACKEND_PORT = '3002';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    proxy: {
      '/api': {
        target: `http://${BACKEND_IP}:${BACKEND_PORT}`,
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: `http://${BACKEND_IP}:${BACKEND_PORT}`,
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
