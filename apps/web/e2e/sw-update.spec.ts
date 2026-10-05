import { execSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { startStaticServer } from './helpers/staticServer';

function build(version: string, outDir: string) {
  execSync(`pnpm exec vite build --outDir "${outDir}" --emptyOutDir`, {
    cwd: join(import.meta.dirname, '..'),
    env: { ...process.env, VITE_APP_VERSION: version },
    stdio: 'pipe',
  });
}

test('al publicar una versión nueva se avisa, sin recargar solo ni perder lo que se está haciendo', async ({ page }) => {
  test.setTimeout(180_000);
  const base = mkdtempSync(join(tmpdir(), 'medapoyo-sw-'));
  const v1 = join(base, 'v1');
  const v2 = join(base, 'v2');
  build('1.0.0', v1);
  build('2.0.0', v2);
  const { server, port, setRoot } = await startStaticServer(v1);
  const URL = `http://localhost:${port}`;

  try {
    // Versión 1: primera visita y recarga para que el service worker controle la página.
    await page.goto(URL);
    await page.getByRole('button', { name: 'Entendí y acepto' }).click();
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.getByRole('button', { name: 'Saltar' }).click();
    await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    // El usuario está a mitad de un cálculo.
    await page.goto(`${URL}/calculadoras/imc`);
    await page.getByLabel('Peso', { exact: true }).fill('70');
    await page.evaluate(() => ((window as unknown as { __alive: boolean }).__alive = true));
    await expect(page.getByText('Actualizar')).toHaveCount(0);

    // Se publica la versión 2 y el navegador busca actualización.
    setRoot(v2);
    await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r?.update()));

    // Aparece el aviso…
    const banner = page.getByRole('status').filter({ hasText: 'Nueva versión disponible' });
    await expect(banner).toBeVisible({ timeout: 20_000 });

    // …y NO se recargó ni se perdió el dato (esperamos un poco para darle chance de recargar solo).
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => (window as unknown as { __alive?: boolean }).__alive)).toBe(true);
    await expect(page.getByLabel('Peso', { exact: true })).toHaveValue('70');

    // Sigue corriendo la versión 1 hasta que el usuario decide.
    await page.goto(`${URL}/ajustes`);
    await expect(page.getByText('Versión de la app: 1.0.0')).toBeVisible();
    await expect(banner).toBeVisible(); // el aviso persiste al navegar dentro de la app
    await page.evaluate(() => ((window as unknown as { __alive: boolean }).__alive = true));

    // El usuario acepta: se activa la versión 2 y recarga.
    await banner.getByRole('button', { name: 'Actualizar' }).click();
    await expect(page.getByText('Versión de la app: 2.0.0')).toBeVisible({ timeout: 20_000 });
    expect(await page.evaluate(() => (window as unknown as { __alive?: boolean }).__alive)).toBeUndefined(); // la página recargó
    await expect(page.getByRole('status').filter({ hasText: 'Nueva versión disponible' })).toHaveCount(0);
  } finally {
    await new Promise((r) => server.close(r));
  }
});
