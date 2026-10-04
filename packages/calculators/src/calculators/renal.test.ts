import { describe, expect, it } from 'vitest';
import { ckdEpi2021, ckdEpi2021Egfr, estadioG, cockcroftGault } from './renal';

// Los valores esperados se calcularon a mano con la fórmula; falta cotejarlos con ejemplos publicados (docs/verificacion.md).
describe('CKD-EPI 2021', () => {
  it('mujer 54 años, Cr 1.2 → 54 (G3a)', () => {
    const r = ckdEpi2021.run({ creatinina: 1.2, edad: 54, sexo: 'f' });
    expect(r.ok && r.presentation.value).toBe('54');
    expect(r.ok && r.interpretation?.label).toBe('G3a');
  });
  it('hombre 50 años, Cr 0.9 → 142 × 0.9938^50 ≈ 104', () => {
    expect(ckdEpi2021Egfr({ creatinina: 0.9, edad: 50, sexo: 'm' })).toBeCloseTo(142 * 0.9938 ** 50, 6);
  });
  it('hombre 70 años, Cr 2.0 → 35', () => {
    const r = ckdEpi2021.run({ creatinina: 2, edad: 70, sexo: 'm' });
    expect(r.ok && r.presentation.value).toBe('35');
    expect(r.ok && r.interpretation?.label).toBe('G3b');
  });
  it('Cr en µmol/L equivale tras convertir', () => {
    const a = ckdEpi2021Egfr({ creatinina: 106.08 / 88.4, edad: 40, sexo: 'm' });
    const b = ckdEpi2021Egfr({ creatinina: 1.2, edad: 40, sexo: 'm' });
    expect(a).toBeCloseTo(b, 9);
  });
  it('estadios en los bordes', () => {
    expect(estadioG(90).label).toBe('G1');
    expect(estadioG(89.9).label).toBe('G2');
    expect(estadioG(60).label).toBe('G2');
    expect(estadioG(59.9).label).toBe('G3a');
    expect(estadioG(45).label).toBe('G3a');
    expect(estadioG(30).label).toBe('G3b');
    expect(estadioG(15).label).toBe('G4');
    expect(estadioG(14.9).label).toBe('G5');
  });
  it('rechaza menores de 18, Cr fuera de rango y sexo faltante', () => {
    expect(ckdEpi2021.run({ creatinina: 1, edad: 17, sexo: 'f' }).ok).toBe(false);
    expect(ckdEpi2021.run({ creatinina: 0.1, edad: 40, sexo: 'f' }).ok).toBe(false);
    expect(ckdEpi2021.run({ creatinina: 1, edad: 40.5, sexo: 'f' }).ok).toBe(false);
    expect(ckdEpi2021.run({ creatinina: 1, edad: 40 })).toMatchObject({ ok: false, errors: { sexo: 'Elegí una opción.' } });
  });
});

describe('Cockcroft-Gault', () => {
  it('hombre 60 años, 80 kg, Cr 1.0 → 88.9', () => {
    const r = cockcroftGault.run({ edad: 60, peso: 80, creatinina: 1, sexo: 'm' });
    expect(r.ok && r.presentation.value).toBe('89');
    expect(r.ok && r.output).toBeCloseTo(88.888, 2);
  });
  it('mujer aplica 0.85', () => {
    const m = cockcroftGault.run({ edad: 60, peso: 80, creatinina: 1, sexo: 'm' });
    const f = cockcroftGault.run({ edad: 60, peso: 80, creatinina: 1, sexo: 'f' });
    expect(m.ok && f.ok && f.output / m.output).toBeCloseTo(0.85, 10);
  });
  it('mujer 75 años, 55 kg, Cr 1.4 → 30', () => {
    const r = cockcroftGault.run({ edad: 75, peso: 55, creatinina: 1.4, sexo: 'f' });
    expect(r.ok && r.presentation.value).toBe('30');
  });
  it('rechaza peso fuera de rango', () => {
    expect(cockcroftGault.run({ edad: 60, peso: 10, creatinina: 1, sexo: 'm' }).ok).toBe(false);
  });
});
