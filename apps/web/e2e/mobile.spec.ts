import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const SHOTS = process.env.SHOTS_DIR;

async function onboard(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entendí y acepto' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Descargar catálogo' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Catálogo actualizado' })).toBeVisible();
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();
}

/** Elementos interactivos visibles más chicos que 44 px (objetivo táctil mínimo). */
async function smallTargets(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    const sel = 'button, a[href], input:not([type=hidden]):not(.sr-only), select, summary, [role=radio], [role=gridcell]';
    for (const el of document.querySelectorAll<HTMLElement>(sel)) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || el.closest('.sr-only')) continue;
      if (el.tagName === 'INPUT' && ['checkbox', 'radio'].includes((el as HTMLInputElement).type)) continue; // su <label> es el objetivo
      if (r.height < 43.5 || r.width < 43.5) out.push(`${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
    }
    return out;
  });
}
const overflowX = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

/** Pantalla lista: título visible y fuentes cargadas (networkidle es frágil con un service worker). */
async function settled(page: Page) {
  await page.getByRole('heading', { level: 1 }).first().waitFor();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

const routes: [string, string][] = [
  ['/', 'inicio'],
  ['/medicamentos', 'medicamentos'],
  ['/medicamentos/minsal-00101009', 'ficha'],
  ['/calculadoras', 'calculadoras'],
  ['/calculadoras/ckd-epi-2021', 'ckd'],
  ['/calculadoras/glasgow', 'glasgow'],
  ['/calculadoras/sofa', 'sofa'],
  ['/turnos', 'turnos'],
  ['/turnos/horas', 'horas'],
  ['/turnos/tipos', 'tipos'],
  ['/ajustes', 'ajustes'],
];

test('móvil: sin desborde horizontal ni objetivos táctiles chicos', async ({ page }) => {
  await onboard(page);
  const problems: string[] = [];
  for (const [path, name] of routes) {
    await page.goto(path);
    await settled(page);
    if (path === '/turnos') await page.getByRole('grid').waitFor();
    if (path === '/calculadoras/ckd-epi-2021') {
      await page.getByLabel('Creatinina sérica', { exact: true }).fill('1.2');
      await page.getByLabel('Edad', { exact: true }).fill('54');
      await page.getByRole('radio', { name: 'Mujer' }).click();
    }
    const ox = await overflowX(page);
    if (ox > 0) problems.push(`${name}: desborde horizontal de ${ox}px`);
    for (const t of await smallTargets(page)) problems.push(`${name}: objetivo chico → ${t}`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` });
  }
  expect(problems).toEqual([]);
});

test('móvil: el resultado de la calculadora queda fijo abajo mientras se baja', async ({ page }) => {
  await onboard(page);
  await page.goto('/calculadoras/sofa');
  const result = page.getByRole('complementary').filter({ hasText: 'Resultado' }).last();
  await expect(result).toBeVisible();
  await page.getByRole('main').evaluate((el) => el.scrollTo(0, el.scrollHeight / 2));
  const box = await result.boundingBox();
  const nav = await page.getByRole('navigation', { name: 'Navegación principal' }).last().boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(nav!.y + 1); // pegado justo sobre la barra inferior
  expect(box!.y).toBeGreaterThan(300); // abajo, no tapando los campos
});

test('móvil: la barra inferior navega entre las 4 secciones', async ({ page }) => {
  await onboard(page);
  const nav = page.getByRole('navigation', { name: 'Navegación principal' }).last();
  for (const [name, url] of [['Medicamentos', /medicamentos/], ['Calculadoras', /calculadoras/], ['Turnos', /turnos/], ['Inicio', /\/$/]] as const) {
    await nav.getByRole('link', { name }).tap();
    await expect(page).toHaveURL(url);
  }
});

test('móvil: la página de fuentes se lee completa, sin desborde, y se llega desde Ajustes', async ({ page }) => {
  await onboard(page);
  await page.goto('/ajustes');
  await page.getByRole('link', { name: 'Ver las fuentes y sus licencias' }).click();
  await expect(page.getByRole('heading', { name: 'Fuentes', level: 1 })).toBeVisible();
  await expect(page.getByText('no es una publicación oficial').first()).toBeVisible();
  for (const name of ['MINSAL', 'ISSS', 'FOSALUD']) await expect(page.getByRole('heading', { level: 3, name: new RegExp(name) })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
