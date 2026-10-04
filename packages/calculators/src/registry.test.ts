import { describe, expect, it } from 'vitest';
import { buildCopyText } from './helpers';
import { calculators, getCalculator } from './registry';

describe('registro', () => {
  it('ids únicos y metadatos obligatorios', () => {
    expect(new Set(calculators.map((c) => c.id)).size).toBe(calculators.length);
    for (const c of calculators) {
      expect(c.formula, c.id).toBeTruthy();
      expect(c.references.length, c.id).toBeGreaterThan(0);
      expect(c.inputs.length, c.id).toBeGreaterThan(0);
    }
  });
});

describe('texto copiado', () => {
  it('sigue el formato de CKD-EPI del plan §9.6', () => {
    const c = getCalculator('ckd-epi-2021')!;
    const text = buildCopyText(
      c,
      { creatinina: { raw: '1.2', unitLabel: 'mg/dL' }, edad: { raw: '54', unitLabel: 'años' }, sexo: { raw: 'f' } },
      { value: '54', unit: 'mL/min/1.73 m²' },
      { label: 'G3a' },
    );
    expect(text).toBe('CKD-EPI 2021: Cr 1.2 mg/dL, 54 años, mujer → 54 mL/min/1.73 m² (G3a)');
  });
  it('escalas: omite criterios en cero', () => {
    const c = getCalculator('cha2ds2-vasc')!;
    const text = buildCopyText(c, { ic: { raw: '0' }, hta: { raw: '1' }, edad: { raw: '2' }, sexo: { raw: '1' } }, { value: '4', unit: '/ 9' }, { label: 'Riesgo alto (≥ 2)' });
    expect(text).toBe('CHA₂DS₂-VASc: HTA, edad ≥ 75, mujer → 4 / 9 (Riesgo alto (≥ 2))');
  });
});
