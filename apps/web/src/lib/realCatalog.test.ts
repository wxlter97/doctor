import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { catalogSchema, manifestSchema, sha256Hex } from '@medapoyo/shared';
import { buildIndex } from './medicationSearch';
import { sources } from '../features/sources/sources';

// Catálogo publicado en public/catalog (hoy: LOM/MINSAL 2026 + LOM/ISSS 19.ª ed. + LIM-FOSALUD 2019, parcial).
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
    expect(catalog.institutions.map((i) => i.id)).toEqual(['minsal', 'isss', 'fosalud']);
    expect(catalog.institutions[2]?.listEdition).toContain('2019');
    expect(catalog.institutions[0]?.listEdition).toContain('1201');
    expect(catalog.institutions[1]?.listEdition).toContain('19');
    // MINSAL e ISSS siempre traen código; FOSALUD puede no traerlo si el OCR no lo leyó bien (no se publica un código dudoso).
    expect(catalog.medications.every((m) => m.institutions.length > 0 && m.institutions.every((i) => i.code || i.id === 'fosalud'))).toBe(true);
  });
  it('encuentra por nombre, sinónimo y tildes', () => {
    expect(names('paracetamol').some((n) => /Acetaminofén/.test(n))).toBe(true);
    expect(names('ACETAMINOFEN').some((n) => /Acetaminofén/.test(n))).toBe(true);
    expect(names('insulina').some((n) => /Insulina/.test(n))).toBe(true);
    expect(names('amoxicilina').length).toBeGreaterThan(1);
  });
  it('filtra por institución', () => {
    const count = (id: string) => catalog.medications.filter((m) => m.institutions.some((i) => i.id === id)).length;
    expect(index.search('', { institutions: ['minsal'] })).toHaveLength(count('minsal'));
    expect(index.search('', { institutions: ['isss'] })).toHaveLength(count('isss'));
    expect(count('minsal')).toBeGreaterThan(700);
    expect(count('isss')).toBeGreaterThan(700);
    expect(count('fosalud')).toBeGreaterThan(60);
    expect(index.search('', { institutions: ['fosalud'] })).toHaveLength(count('fosalud'));
    expect(index.search('', { institutions: ['minsal', 'isss'] }).length).toBeLessThanOrEqual(catalog.medications.length);
  });
  it('hay medicamentos en ambas listas y cada ficha conserva su código y presentación por institución', () => {
    const both = catalog.medications.filter((m) => m.institutions.length === 2);
    expect(both.length).toBeGreaterThan(200);
    expect(both.some((m) => m.institutions.map((i) => i.id).join() === 'minsal,isss')).toBe(true);
    expect(catalog.medications.some((m) => m.institutions.length === 3)).toBe(true);
  });
  it('la página de fuentes cubre cada institución del catálogo, con su edición y enlace', () => {
    for (const inst of catalog.institutions) {
      const src = sources.find((x) => x.id === inst.id);
      expect(src, `falta la fuente de ${inst.id}`).toBeDefined();
      expect(src!.url).toBe(inst.sourceUrl);
      expect(src!.date.includes(String(inst.sourceDate?.slice(0, 4)))).toBe(true);
    }
  });
  it('rendimiento: búsqueda ≤ 50 ms con el catálogo real', () => {
    const t = Array.from({ length: 7 }, () => { const s = performance.now(); index.search('amoxicilina'); return performance.now() - s; }).sort((a, b) => a - b);
    expect(t[3]!).toBeLessThan(50);
  });
});
