import { describe, expect, it } from 'vitest';
import { bsa, bsaCalc } from './bsa';

describe('Superficie corporal', () => {
  it('Mosteller 180 cm, 80 kg = 2.00 m² exacto', () => {
    expect(bsaCalc({ peso: 80, talla: 180, metodo: 'mosteller' })).toBe(2);
  });
  it('Mosteller 170 cm, 70 kg → 1.82', () => {
    const r = bsa.run({ peso: 70, talla: 170, metodo: 'mosteller' });
    expect(r.ok && r.presentation.value).toBe('1.82');
  });
  it('DuBois 170 cm, 70 kg → 1.81 (cálculo manual de la fórmula)', () => {
    const r = bsa.run({ peso: 70, talla: 170, metodo: 'dubois' });
    expect(r.ok && r.presentation.value).toBe('1.81');
  });
  it('bordes y entradas inválidas', () => {
    expect(bsa.run({ peso: 0.5, talla: 30, metodo: 'mosteller' }).ok).toBe(true);
    expect(bsa.run({ peso: 0.4, talla: 100, metodo: 'mosteller' }).ok).toBe(false);
    expect(bsa.run({ peso: 70, talla: 170, metodo: 'otra' }).ok).toBe(false);
  });
});
