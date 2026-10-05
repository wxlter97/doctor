import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { startStaticServer } from './helpers/staticServer';

test('tras la primera visita, la app completa funciona sin conexión', async ({ page }) => {
  // Servidor propio sobre el build: "sin conexión" = servidor apagado (real, y funciona igual en los tres motores;
  // context.setOffline falla en WebKit al recargar páginas servidas por el service worker).
  const { server, port } = await startStaticServer(join(import.meta.dirname, '..', 'dist'));
  const URL = `http://localhost:${port}`;
  try {
    // Primera visita: aviso legal, instalación y descarga del catálogo.
    await page.goto(URL);
    await page.getByRole('button', { name: 'Entendí y acepto' }).click();
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.getByRole('button', { name: 'Descargar catálogo' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Catálogo actualizado' })).toBeVisible();
    await page.getByRole('button', { name: 'Empezar' }).click();
    await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();

    // El service worker toma el control en la siguiente carga con red.
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    // Sin red.
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    // Control: sin servidor, una petición a la red de verdad falla.
    expect(await page.evaluate(() => fetch('/catalog/manifest.json', { cache: 'no-store' }).then(() => 'ok', () => 'fallo'))).toBe('fallo');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();

    // Calculadoras: IMC con resultado en vivo.
    await page.goto(`${URL}/calculadoras/imc`);
    await page.getByLabel('Peso', { exact: true }).fill('70');
    await page.getByLabel('Talla', { exact: true }).fill('175');
    await expect(page.getByText('22.9')).toBeVisible();

    // Catálogo descargado antes de quedar offline.
    await page.goto(`${URL}/medicamentos`);
    await page.getByRole('searchbox').fill('paracetamol');
    await expect(page.getByRole('link', { name: /Acetaminofén/ }).first()).toBeVisible();

    // Turnos: carga el calendario y asigna un turno con datos locales.
    await page.goto(`${URL}/turnos`);
    await expect(page.getByRole('grid')).toBeVisible();
    await page.getByRole('gridcell').nth(10).click();
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Turnos del mes')).toBeVisible();
    await expect(page.getByText(/\d+ h en total/)).toBeVisible();
  } finally {
    server.closeAllConnections();
    server.close();
  }
});
