import { describe, expect, it } from 'vitest';
import { imc, categoriaImc } from './imc';

describe('IMC', () => {
  it('70 kg, 175 cm → 22.9', () => {
    const r = imc.run({ peso: 70, talla: 175 });
    expect(r.ok && r.presentation.value).toBe('22.9');
  });
  it('categorías OMS en los bordes', () => {
    expect(categoriaImc(18.49).label).toBe('Bajo peso');
    expect(categoriaImc(18.5).label).toBe('Normal');
    expect(categoriaImc(24.99).label).toBe('Normal');
    expect(categoriaImc(25).label).toBe('Sobrepeso');
    expect(categoriaImc(30).label).toBe('Obesidad grado I');
    expect(categoriaImc(35).label).toBe('Obesidad grado II');
    expect(categoriaImc(40).label).toBe('Obesidad grado III');
  });
  it('100 kg, 180 cm → 30.9 obesidad I', () => {
    const r = imc.run({ peso: 100, talla: 180 });
    expect(r.ok && r.presentation.value).toBe('30.9');
    expect(r.ok && r.interpretation?.label).toBe('Obesidad grado I');
  });
  it('rechaza entradas inválidas', () => {
    expect(imc.run({ peso: 10, talla: 175 }).ok).toBe(false);
    expect(imc.run({ talla: 175 })).toMatchObject({ ok: false, errors: { peso: expect.stringContaining('Ingresá') } });
    expect(imc.run({ peso: NaN, talla: 175 }).ok).toBe(false);
  });
});
