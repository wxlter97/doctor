import { defineConfig } from '@playwright/test';

// Localmente usa el Chrome instalado (PW_CHANNEL=chrome); en CI instala Chromium.
const channel = process.env.PW_CHANNEL;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', ...(channel ? { channel } : {}) },
  // El service worker solo existe en el build de producción.
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 3000 },
  },
});
