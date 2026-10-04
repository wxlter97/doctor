/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.VITE_APP_VERSION ?? '0.0.0') },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'MedApoyo SV',
        short_name: 'MedApoyo',
        description: 'Apoyo para médicos en El Salvador: medicamentos, calculadoras y turnos.',
        lang: 'es-SV',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#282828',
        theme_color: '#282828',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
      devOptions: { enabled: false },
    }),
  ],
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'], globals: true },
});
