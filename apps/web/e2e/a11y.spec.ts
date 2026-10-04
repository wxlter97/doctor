import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function onboard(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entendí y acepto' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Descargar catálogo' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Catálogo actualizado' })).toBeVisible();
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();
}

const routes = ['/', '/medicamentos', '/medicamentos/fixture-001', '/calculadoras', '/calculadoras/ckd-epi-2021', '/calculadoras/sofa', '/turnos', '/turnos/horas', '/turnos/tipos', '/ajustes'];

async function violations(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
}

for (const scheme of ['light', 'dark'] as const) {
  for (const density of ['comfortable', 'compact'] as const) {
    test(`axe WCAG 2.1 AA — tema ${scheme}, densidad ${density}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await onboard(page);
      await page.evaluate((d) => document.documentElement.setAttribute('data-density', d), density);
      const found: string[] = [];
      for (const path of routes) {
        await page.goto(path);
        await page.evaluate((d) => document.documentElement.setAttribute('data-density', d), density);
        if (path === '/turnos') await page.getByRole('grid').waitFor();
        await page.waitForLoadState('networkidle');
        for (const v of await violations(page)) found.push(`${path}: ${v}`);
      }
      expect(found).toEqual([]);
    });
  }
}

test('el tema y la densidad cambian sin recargar y persisten', async ({ page }) => {
  await onboard(page);
  await page.goto('/ajustes');
  await page.evaluate(() => ((window as unknown as { __marker: number }).__marker = 1)); // si recarga, se pierde
  await page.getByRole('radio', { name: 'Oscuro' }).click();
  await page.getByRole('radio', { name: 'Compacta' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(1);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
});

test('todo es operable solo con teclado (atajos, foco visible, hojas con Esc)', async ({ page }) => {
  await onboard(page);
  await page.keyboard.press('3');
  await expect(page).toHaveURL(/calculadoras/);
  await page.keyboard.press('4');
  await expect(page).toHaveURL(/turnos/);
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'Atajos de teclado' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // Ctrl+K y / llevan al buscador global, y escribir ahí no dispara los atajos de una tecla.
  await page.keyboard.press('Control+k');
  await expect(page.locator('#global-search')).toBeFocused();
  await page.keyboard.type('3');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#global-search')).toHaveValue('3');
  // Foco visible: todo elemento enfocado con Tab tiene contorno.
  await page.locator('#global-search').blur();
  const bad: string[] = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      return { tag: el.tagName, name: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 25), outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 };
    });
    if (info && !info.outline) bad.push(`${info.tag} "${info.name}"`);
  }
  expect(bad).toEqual([]);
  // Calendario: flechas mueven entre días, Enter abre la hoja y Esc la cierra.
  await page.goto('/turnos');
  await page.getByRole('gridcell').nth(10).focus();
  const before = await page.evaluate(() => (document.activeElement as HTMLElement).dataset.date);
  await page.keyboard.press('ArrowRight');
  const after = await page.evaluate(() => (document.activeElement as HTMLElement).dataset.date);
  expect(after).not.toBe(before);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
