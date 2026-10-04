import { describe, expect, it } from 'vitest';
import { buildSnapshot, catalogSchema, sha256Hex, type Catalog } from './catalog';

const base: Catalog = {
  version: 1,
  publishedAt: '2026-01-01T00:00:00Z',
  institutions: [{ id: 'minsal', name: 'MINSAL' }],
  synonyms: { paracetamol: 'acetaminofen' },
  medications: [{
    id: 'a', genericName: 'Acetaminofén', activeIngredients: ['acetaminofén'], form: 'tableta', strength: '500 mg',
    searchTerms: [], institutions: [{ id: 'minsal' }],
  }],
};

describe('esquema del catálogo', () => {
  it('acepta un catálogo válido y arma el manifiesto con el hash del JSON', async () => {
    const { json, manifest, filename } = await buildSnapshot(base);
    expect(filename).toBe('catalog-v1.json');
    expect(manifest).toMatchObject({ version: 1, count: 1, url: '/catalog/catalog-v1.json' });
    expect(manifest.sha256).toBe(await sha256Hex(json));
    expect(manifest.sha256).toHaveLength(64);
  });
  it('rechaza instituciones desconocidas, ids duplicados y medicamentos sin institución', () => {
    const m = base.medications[0]!;
    expect(catalogSchema.safeParse({ ...base, medications: [{ ...m, institutions: [{ id: 'otra' }] }] }).success).toBe(false);
    expect(catalogSchema.safeParse({ ...base, medications: [m, m] }).success).toBe(false);
    expect(catalogSchema.safeParse({ ...base, medications: [{ ...m, institutions: [] }] }).success).toBe(false);
  });
  it('rechaza versión inválida y campos obligatorios faltantes', () => {
    expect(catalogSchema.safeParse({ ...base, version: 0 }).success).toBe(false);
    expect(catalogSchema.safeParse({ ...base, medications: [{ ...base.medications[0], form: '' }] }).success).toBe(false);
  });
  it('sha256 conocido', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
