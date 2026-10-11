import { expect, test, type Page } from '@playwright/test';

async function onboard(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entendí y acepto' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Saltar' }).click();
  await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();
}

test('un nocturno marca los dos días y el mismo día admite varios turnos (nocturno que termina + post-guardia)', async ({ page }) => {
  await onboard(page);
  await page.goto('/turnos');
  await page.getByRole('grid').waitFor();
  const cell = (day: string) => page.locator(`[role=gridcell][data-date$="-${day}"]`).first();

  // Nocturno el día 15: empieza 19:00 y termina el 16 a las 07:00
  await cell('15').click();
  await page.getByRole('radio', { name: 'Nocturno' }).click();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(cell('15')).toHaveAttribute('aria-label', /Nocturno/);
  await expect(cell('16')).toHaveAttribute('aria-label', /Nocturno \(continúa del día anterior\)/);

  // El día 16 se agrega además la post-guardia: dos turnos el mismo día
  await cell('16').click();
  await expect(page.getByText('Empezó')).toBeVisible(); // el nocturno aparece en el día que termina
  await page.getByRole('radio', { name: 'Post-guardia' }).click();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(cell('16')).toHaveAttribute('aria-label', /Post-guardia/);
  await expect(cell('16')).toHaveAttribute('aria-label', /Nocturno \(continúa del día anterior\)/);

  // El pincel no borra lo que ya hay: pintar un diurno el día 16 (empieza 07:00, justo cuando termina el nocturno) se agrega
  await page.getByRole('button', { name: 'Modo pincel' }).click();
  await page.getByRole('radio', { name: 'Diurno' }).click();
  await cell('16').click();
  await expect(cell('16')).toHaveAttribute('aria-label', /Diurno/);
  await expect(cell('16')).toHaveAttribute('aria-label', /Nocturno/);
  await expect(cell('16')).toHaveAttribute('aria-label', /Post-guardia/);
});
