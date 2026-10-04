import { beforeEach, describe, expect, it } from 'vitest';
import { buildSnapshot, type Catalog } from '@medapoyo/shared';
import { db } from '../db';
import { localCatalogVersion, updateCatalog } from './catalogUpdate';

const cat = (version: number, names: string[]): Catalog => ({
  version, publishedAt: '2026-01-01T00:00:00Z',
  institutions: [{ id: 'minsal', name: 'MINSAL' }], synonyms: {},
  medications: names.map((n, i) => ({ id: `${version}-${i}`, genericName: n, activeIngredients: [n], form: 'tableta', strength: '1 mg', searchTerms: [], institutions: [{ id: 'minsal' }] })),
});

async function server(c: Catalog, opts: { tamper?: boolean; missingFile?: boolean } = {}) {
  const { json, manifest } = await buildSnapshot(c);
  const body = opts.tamper ? json.replace('tableta', 'tabletA') : json;
  const fetchFn = (async (url: string) => {
    if (url.endsWith('manifest.json')) return new Response(JSON.stringify(manifest));
    if (opts.missingFile) return new Response('nope', { status: 404 });
    return new Response(body);
  }) as unknown as typeof fetch;
  return fetchFn;
}

beforeEach(async () => { await db.medications.clear(); await db.meta.clear(); });

describe('actualización del catálogo', () => {
  it('descarga, valida y guarda; luego queda "al día"', async () => {
    expect(await updateCatalog({ fetchFn: await server(cat(1, ['A', 'B'])) })).toEqual({ status: 'updated', version: 1 });
    expect(await db.medications.count()).toBe(2);
    expect(await localCatalogVersion()).toBe(1);
    expect(await updateCatalog({ fetchFn: await server(cat(1, ['A', 'B'])) })).toEqual({ status: 'current', version: 1 });
  });
  it('una versión nueva reemplaza a la anterior por completo', async () => {
    await updateCatalog({ fetchFn: await server(cat(1, ['A', 'B'])) });
    await updateCatalog({ fetchFn: await server(cat(2, ['C'])) });
    expect((await db.medications.toArray()).map((m) => m.genericName)).toEqual(['C']);
  });
  it('un hash que no coincide NO rompe la versión local', async () => {
    await updateCatalog({ fetchFn: await server(cat(1, ['A', 'B'])) });
    const r = await updateCatalog({ fetchFn: await server(cat(2, ['C']), { tamper: true }) });
    expect(r.status).toBe('error');
    expect(await localCatalogVersion()).toBe(1);
    expect(await db.medications.count()).toBe(2);
  });
  it('descarga caída o sin red conserva lo local', async () => {
    await updateCatalog({ fetchFn: await server(cat(1, ['A'])) });
    expect((await updateCatalog({ fetchFn: await server(cat(2, ['C']), { missingFile: true }) })).status).toBe('error');
    const offline = (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch;
    expect(await updateCatalog({ fetchFn: offline })).toEqual({ status: 'offline' });
    expect(await localCatalogVersion()).toBe(1);
  });
  it('un catálogo que no pasa el esquema se rechaza aunque el hash sea correcto', async () => {
    const bad = cat(2, ['C']);
    bad.medications[0]!.institutions = [{ id: 'inexistente' }];
    const json = JSON.stringify(bad);
    const { sha256Hex } = await import('@medapoyo/shared');
    const manifest = { version: 2, publishedAt: bad.publishedAt, url: '/catalog/catalog-v2.json', sha256: await sha256Hex(json), count: 1 };
    const fetchFn = (async (u: string) => new Response(u.endsWith('manifest.json') ? JSON.stringify(manifest) : json)) as unknown as typeof fetch;
    expect((await updateCatalog({ fetchFn })).status).toBe('error');
    expect(await db.medications.count()).toBe(0);
  });
  it('reporta progreso al terminar', async () => {
    const seen: number[] = [];
    await updateCatalog({ fetchFn: await server(cat(1, ['A'])), onProgress: (f) => seen.push(f) });
    expect(seen.at(-1)).toBe(1);
  });
});
