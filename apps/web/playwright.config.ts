import { defineConfig } from '@playwright/test';

// Localmente usa el Chrome instalado (PW_CHANNEL=chrome); en CI instala Chromium.
const channel = process.env.PW_CHANNEL;

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000, // las pruebas de accesibilidad recorren 10 pantallas y 3 motores corren a la vez
  workers: 2,
  fullyParallel: false,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', ...(channel ? { channel } : {}) } },
    // isMobile no existe en Firefox: la prueba de móvil corre en Chromium y WebKit.
    { name: 'firefox', use: { browserName: 'firefox' }, testIgnore: /mobile\.spec/ },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  // El service worker solo existe en el build de producción.
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 3000 },
  },
});
