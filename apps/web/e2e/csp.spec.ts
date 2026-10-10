import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

// La CSP real de producción (vercel.json): si algo viola script-src (scripts en línea, eval, new Function), este test falla.
const vercel = JSON.parse(readFileSync(join(import.meta.dirname, '../../../vercel.json'), 'utf8')) as { headers: { headers: { key: string; value: string }[] }[] };
const CSP = vercel.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy')!.value;

test.use({ serviceWorkers: 'block' });

test('con la CSP de producción no hay violaciones al abrir, descargar el catálogo y usar una calculadora', async ({ page }) => {
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue();
    const res = await route.fetch();
    await route.fulfill({ response: res, headers: { ...res.headers(), 'content-security-policy': CSP } });
  });
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI} @ ${e.sourceFile}:${e.lineNumber}:${e.columnNumber}`));
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Entendí y acepto' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Descargar catálogo' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Catálogo actualizado' })).toBeVisible();
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();
  await page.goto('/calculadoras/imc'); // recarga el documento con la CSP y ejecuta zod
  await page.getByLabel('Peso', { exact: true }).fill('70');
  await page.getByLabel('Talla', { exact: true }).fill('175');
  await expect(page.getByText('22.9').first()).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)).toEqual([]);
});
