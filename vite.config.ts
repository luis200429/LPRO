import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// SUSTITUYE ESTA IP POR LA DE TU SERVIDOR (ej: '192.168.1.50' o '34.23.12.1')
const BACKEND_IP = 'localhost'; 
const BACKEND_PORT = '3002';

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    // --- INICIO CONFIGURACIÓN PWA ---
    VitePWA({
      devOptions: { enabled: true },
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Auga Calidade',
        short_name: 'Auga',
        description: 'Panel de control de calidad del agua',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
    // --- FIN CONFIGURACIÓN PWA ---
  ],
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