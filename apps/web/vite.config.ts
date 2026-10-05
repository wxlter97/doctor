/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import type { Plugin } from 'vite';

/** Precarga las fuentes del primer pintado (los nombres llevan hash, por eso se calculan del bundle). */
const preloadFonts = (): Plugin => ({
  name: 'preload-fonts',
  transformIndexHtml: {
    order: 'post',
    handler(_html, ctx) {
      const files = Object.keys(ctx.bundle ?? {}).filter((f) => /(archivo-latin-(400|700)|archivo-black-latin-400)-normal-.*\.woff2$/.test(f));
      return files.map((f) => ({ tag: 'link', injectTo: 'head', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: `/${f}` } }));
    },
  },
});

export default defineConfig({
  define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.VITE_APP_VERSION ?? '0.0.0') },
  plugins: [
    // ANALYZE=1 pnpm build → dist/stats.json (peso por módulo)
    ...(process.env.ANALYZE ? [visualizer({ filename: 'dist/stats.json', template: 'raw-data', gzipSize: true })] : []),
    react(),
    tailwindcss(),
    preloadFonts(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'MedHelp',
        short_name: 'MedHelp',
        description: 'Apoyo para médicos en El Salvador: medicamentos, calculadoras y turnos.',
        lang: 'es-SV',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#111111',
        theme_color: '#111111',
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
  // Los specs de Playwright viven en e2e/ y los corre `pnpm e2e`, no Vitest.
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'], globals: true, include: ['src/**/*.test.{ts,tsx}'] },
});
