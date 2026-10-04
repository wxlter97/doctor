import { describe, expect, it } from 'vitest';
import { edadGestacional, naegele } from './obstetricia';

describe('Edad gestacional y FPP (Naegele)', () => {
  it('FUM 2026-01-01 → FPP 2026-10-08', () => {
    expect(naegele({ fum: '2026-01-01', referencia: '2026-01-01' }).fpp).toBe('2026-10-08');
  });
  it('FUM 2025-03-15 → FPP 2025-12-20 (cruza de año bisiesto no aplica)', () => {
    expect(naegele({ fum: '2025-03-15', referencia: '2025-03-15' }).fpp).toBe('2025-12-20');
  });
  it('FUM en año bisiesto: 2024-02-20 → 2024-11-26', () => {
    expect(naegele({ fum: '2024-02-20', referencia: '2024-02-20' }).fpp).toBe('2024-11-26');
  });
  it('100 días = 14 semanas + 2 días', () => {
    expect(naegele({ fum: '2026-01-01', referencia: '2026-04-11' })).toMatchObject({ semanas: 14, dias: 2 });
  });
  it('día 0 y día 280 son 0+0 y 40+0', () => {
    expect(naegele({ fum: '2026-01-01', referencia: '2026-01-01' })).toMatchObject({ semanas: 0, dias: 0 });
    expect(naegele({ fum: '2026-01-01', referencia: '2026-10-08' })).toMatchObject({ semanas: 40, dias: 0 });
  });
  it('rechaza fecha de cálculo anterior a la FUM y fechas inválidas', () => {
    expect(edadGestacional.run({ fum: '2026-05-01', referencia: '2026-04-30' }).ok).toBe(false);
    expect(edadGestacional.run({ fum: '2026-13-45', referencia: '2026-04-30' }).ok).toBe(false);
    expect(edadGestacional.run({ fum: '2026-01-01' }).ok).toBe(false);
  });
  it('más de 42 semanas avisa', () => {
    const r = edadGestacional.run({ fum: '2026-01-01', referencia: '2026-11-15' });
    expect(r.ok && r.interpretation?.severity).toBe('warning');
  });
});
