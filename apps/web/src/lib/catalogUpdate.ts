import type { Catalog } from '@medapoyo/shared';
import { db, type MedicationRow } from '../db';

export type UpdateStatus =
  | { status: 'updated'; version: number }
  | { status: 'current'; version: number }
  | { status: 'offline' }
  | { status: 'error'; message: string };

export interface UpdateOptions {
  fetchFn?: typeof fetch;
  /** 0–1; solo se informa cuando el servidor indica el tamaño. */
  onProgress?: (fraction: number) => void;
}

export const localCatalogVersion = async () => ((await db.meta.get('catalogVersion'))?.value as number | undefined) ?? 0;

async function readWithProgress(res: Response, onProgress?: (f: number) => void): Promise<Uint8Array> {
  const total = Number(res.headers.get('content-length')) || 0;
  if (!res.body || !onProgress || !total) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    onProgress(Math.min(1, got / total));
  }
  const out = new Uint8Array(got);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

/** Escribe el catálogo en una sola transacción: si falla, queda la versión anterior intacta. */
export async function writeCatalog(catalog: Catalog) {
  const rows = catalog.medications.map((m) => ({ ...m, institutionIds: m.institutions.map((i) => i.id) }));
  await db.transaction('rw', db.medications, db.meta, async () => {
    await db.medications.clear();
    await db.medications.bulkPut(rows as unknown as MedicationRow[]);
    await db.meta.bulkPut([
      { key: 'catalogVersion', value: catalog.version },
      { key: 'catalogPublishedAt', value: catalog.publishedAt },
      { key: 'catalogSource', value: catalog.source ?? null },
      { key: 'institutions', value: catalog.institutions },
      { key: 'synonyms', value: catalog.synonyms },
    ]);
  });
}

export async function updateCatalog({ fetchFn = fetch, onProgress }: UpdateOptions = {}): Promise<UpdateStatus> {
  try {
    // zod se carga al actualizar, no en el arranque.
    const { catalogSchema, manifestSchema, sha256Hex } = await import('@medapoyo/shared');
    let res: Response;
    try {
      res = await fetchFn('/catalog/manifest.json', { cache: 'no-store' });
    } catch {
      return { status: 'offline' };
    }
    if (!res.ok) return { status: 'error', message: `No se pudo leer el manifiesto (${res.status}).` };
    const manifest = manifestSchema.parse(await res.json());
    const local = await localCatalogVersion();
    if (manifest.version <= local) return { status: 'current', version: local };

    const data = await fetchFn(manifest.url, { cache: 'no-store' });
    if (!data.ok) return { status: 'error', message: `No se pudo descargar el catálogo (${data.status}).` };
    const bytes = await readWithProgress(data, onProgress);
    if ((await sha256Hex(bytes)) !== manifest.sha256) return { status: 'error', message: 'El catálogo descargado está corrupto (el hash no coincide).' };
    const catalog = catalogSchema.parse(JSON.parse(new TextDecoder().decode(bytes)));
    if (catalog.version !== manifest.version || catalog.medications.length !== manifest.count) {
      return { status: 'error', message: 'El catálogo no coincide con su manifiesto.' };
    }
    await writeCatalog(catalog);
    onProgress?.(1);
    return { status: 'updated', version: catalog.version };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Error desconocido al actualizar el catálogo.' };
  }
}
