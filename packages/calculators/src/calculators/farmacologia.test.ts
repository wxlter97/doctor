import { describe, expect, it } from 'vitest';
import { dosis, infusion, infusionCalc } from './farmacologia';

describe('Dosis por peso', () => {
  it('15 mg/kg × 20 kg = 300 mg; 120 mg/5 mL = 24 mg/mL → 12.5 mL', () => {
    const r = dosis.run({ peso: 20, dosisKg: 15, concentracion: 24 });
    expect(r.ok && r.presentation.value).toBe('300.00');
    expect(r.ok && r.presentation.extra?.[0]).toBe('Volumen: 12.50 mL');
  });
  it('avisa en rojo cuando supera el tope', () => {
    const r = dosis.run({ peso: 80, dosisKg: 15, tope: 1000 });
    expect(r.ok && r.interpretation).toMatchObject({ severity: 'danger' });
  });
  it('en el tope exacto no avisa', () => {
    const r = dosis.run({ peso: 40, dosisKg: 25, tope: 1000 });
    expect(r.ok && r.interpretation?.severity).toBe('info');
  });
  it('campos opcionales vacíos son válidos; inválidos se rechazan', () => {
    expect(dosis.run({ peso: 10, dosisKg: 1 }).ok).toBe(true);
    expect(dosis.run({ peso: 10, dosisKg: 0 }).ok).toBe(false);
    expect(dosis.run({ peso: 10, dosisKg: 1, concentracion: -2 }).ok).toBe(false);
  });
});

describe('Goteo e infusión', () => {
  it('500 mL en 8 h, macro → 20.8 gotas/min y 62.5 mL/h', () => {
    const o = infusionCalc({ modo: 'volumen', volumen: 500, tiempo: 480, gotero: 20 });
    expect(o.gotasPorMin).toBeCloseTo(20.833, 3);
    expect(o.mlPorHora).toBe(62.5);
  });
  it('micro: 100 mL en 60 min → 100 gotas/min y 100 mL/h', () => {
    const o = infusionCalc({ modo: 'volumen', volumen: 100, tiempo: 60, gotero: 60 });
    expect(o).toMatchObject({ gotasPorMin: 100, mlPorHora: 100 });
  });
  it('5 mcg/kg/min, 70 kg, 1600 mcg/mL → 13.125 mL/h', () => {
    const o = infusionCalc({ modo: 'dosis', dosisMcg: 5, peso: 70, concentracion: 1600 });
    expect(o.mlPorHora).toBeCloseTo(13.125, 6);
  });
  it('run ignora campos de otro modo y exige los del modo activo', () => {
    expect(infusion.run({ modo: 'volumen', volumen: 500, tiempo: 480, gotero: 20, peso: 999 }).ok).toBe(true);
    expect(infusion.run({ modo: 'dosis', volumen: 500, tiempo: 480 }).ok).toBe(false);
    expect(infusion.run({ modo: 'volumen', volumen: 500, tiempo: 0, gotero: 20 }).ok).toBe(false);
  });
});
