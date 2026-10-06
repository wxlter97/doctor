import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { catalogSchema, manifestSchema, sha256Hex } from '@medapoyo/shared';
import { buildIndex } from './medicationSearch';

// Catálogo publicado en public/catalog (hoy: LOM/MINSAL 2026, parcial).
const dir = join(__dirname, '../../public/catalog');
const manifest = manifestSchema.parse(JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')));
const raw = readFileSync(join(dir, manifest.url.replace('/catalog/', '')), 'utf8');
const catalog = catalogSchema.parse(JSON.parse(raw));
const index = buildIndex(catalog.medications, catalog.institutions, catalog.synonyms);
const names = (q: string) => index.search(q).map((m) => m.genericName);

describe('catálogo real publicado', () => {
  it('el manifiesto describe exactamente el archivo', async () => {
    expect(await sha256Hex(raw)).toBe(manifest.sha256);
    expect(catalog.medications.length).toBe(manifest.count);
  });
  it('no es un FIXTURE y declara su cobertura parcial', () => {
    expect(catalog.source).not.toBe('FIXTURE');
    expect(catalog.source).toBe('PARCIAL');
  });
  it('todo medicamento tiene institución con código y atribución de la edición', () => {
    expect(catalog.institutions.map((i) => i.id)).toEqual(['minsal']);
    expect(catalog.institutions[0]?.listEdition).toContain('1201');
    expect(catalog.medications.every((m) => m.institutions[0]?.code)).toBe(true);
  });
  it('encuentra por nombre, sinónimo y tildes', () => {
    expect(names('paracetamol').some((n) => /Acetaminofén/.test(n))).toBe(true);
    expect(names('ACETAMINOFEN').some((n) => /Acetaminofén/.test(n))).toBe(true);
    expect(names('insulina').some((n) => /Insulina/.test(n))).toBe(true);
    expect(names('amoxicilina').length).toBeGreaterThan(1);
  });
  it('filtra por institución', () => {
    expect(index.search('', { institutions: ['minsal'] })).toHaveLength(catalog.medications.length);
    expect(index.search('', { institutions: ['isss'] })).toHaveLength(0);
  });
  it('rendimiento: búsqueda ≤ 50 ms con el catálogo real', () => {
    const t = Array.from({ length: 7 }, () => { const s = performance.now(); index.search('amoxicilina'); return performance.now() - s; }).sort((a, b) => a - b);
    expect(t[3]!).toBeLessThan(50);
  });
});
