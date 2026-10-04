import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { catalogSchema, type CatalogMedication } from '@medapoyo/shared';
import { buildIndex } from './medicationSearch';

const fixture = catalogSchema.parse(JSON.parse(readFileSync(join(__dirname, '../../../../data/fixtures/catalog.dev.json'), 'utf8')));
const index = buildIndex(fixture.medications, fixture.institutions, fixture.synonyms);
const names = (q: string, f?: Parameters<typeof index.search>[1]) => index.search(q, f).map((m) => m.genericName);

describe('búsqueda de medicamentos', () => {
  it('ignora tildes y mayúsculas', () => {
    expect(names('ACIDO acetilsalicilico')).toContain('Ácido acetilsalicílico');
    expect(names('losartan')).toContain('Losartán');
  });
  it('tolera errores menores y prefijos', () => {
    expect(names('ibuprofen')).toContain('Ibuprofeno');
    expect(names('metformna')).toContain('Metformina');
  });
  it('encuentra por sinónimo y por principio activo', () => {
    expect(names('paracetamol')).toContain('Acetaminofén');
    expect(names('dipirona')).toContain('Metamizol');
    expect(names('albuterol')).toContain('Salbutamol');
  });
  it('encuentra por grupo terapéutico', () => {
    expect(names('antidiabeticos')).toEqual(expect.arrayContaining(['Metformina', 'Glibenclamida']));
  });
  it('filtra por institución contra los datos del fixture', () => {
    const only = (id: string) => fixture.medications.filter((m) => m.institutions.some((i) => i.id === id)).length;
    expect(index.search('', { institutions: ['fosalud'] })).toHaveLength(only('fosalud'));
    expect(index.search('', { institutions: ['minsal', 'isss'] }).length).toBe(
      fixture.medications.filter((m) => m.institutions.some((i) => ['minsal', 'isss'].includes(i.id))).length);
    expect(index.search('acetaminofen', { institutions: ['fosalud'] }).every((m) => m.institutions.some((i) => i.id === 'fosalud'))).toBe(true);
  });
  it('filtra por forma y grupo, combinables', () => {
    const r = index.search('', { institutions: [], form: 'tableta', group: 'Antihipertensivos' });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((m) => m.form === 'tableta' && m.therapeuticGroup === 'Antihipertensivos')).toBe(true);
  });
  it('sin coincidencias → vacío; lista vacía ordenada alfabéticamente', () => {
    expect(names('zzzqqq')).toEqual([]);
    const all = names('');
    expect(all).toHaveLength(fixture.medications.length);
    expect(all[0]).toBe('Acetaminofén');
  });
  it('rendimiento: búsqueda ≤ 50 ms con ~5000 medicamentos', () => {
    const big: CatalogMedication[] = Array.from({ length: 5000 }, (_, i) => ({
      id: `m${i}`, genericName: `Fármaco${i} ${['alfa', 'beta', 'gamma'][i % 3]}`, activeIngredients: [`ingrediente${i}`], form: 'tableta',
      strength: `${i} mg`, searchTerms: [], therapeuticGroup: `Grupo ${i % 20}`, institutions: [{ id: 'minsal' }],
    }));
    const idx = buildIndex(big, fixture.institutions, {});
    const times = Array.from({ length: 7 }, () => { const t = performance.now(); idx.search('farmaco12 beta'); return performance.now() - t; }).sort((a, b) => a - b);
    expect(times[3]!).toBeLessThan(50);
  });
});
