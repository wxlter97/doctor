import { describe, expect, it } from 'vitest';
import { holliday, hollidaySegar } from './liquidos';

describe('Holliday-Segar', () => {
  it.each([
    [5, 500], [10, 1000], [15, 1250], [20, 1500], [25, 1600], [70, 2500],
  ])('%s kg → %s mL/día', (kg, ml) => {
    expect(hollidaySegar(kg).mlDia).toBe(ml);
  });
  it('aproxima la regla 4-2-1 (25 kg → 65 mL/h)', () => {
    // 4-2-1: 40 + 20 + 1×(25−20) = 65 mL/h → ×24 = 1560, difiere ~2.5 % de 1600 (la regla es una aproximación)
    const hora = 40 + 20 + 5;
    expect(Math.abs(hollidaySegar(25).mlHora - hora) / hora).toBeLessThan(0.03);
  });
  it('presenta mL/día y mL/h', () => {
    const r = holliday.run({ peso: 25 });
    expect(r.ok && r.presentation).toMatchObject({ value: '1600', unit: 'mL/día', extra: ['Velocidad: 66.7 mL/h'] });
  });
  it('rechaza peso fuera de rango o ausente', () => {
    expect(holliday.run({ peso: 2 }).ok).toBe(false);
    expect(holliday.run({}).ok).toBe(false);
    expect(holliday.run({ peso: 3 }).ok).toBe(true);
  });
});
