import { create } from 'zustand';
import type { CatalogMedication, Institution } from '@medapoyo/shared';
import { db } from '../db';
import { buildIndex, type MedIndex } from '../lib/medicationSearch';

interface CatalogState {
  loaded: boolean;
  version: number;
  source: string | null;
  index: MedIndex | null;
  load: () => Promise<void>;
}

/** Catálogo local (Dexie) con su índice en memoria; se recarga tras cada actualización. */
export const useCatalog = create<CatalogState>((set) => ({
  loaded: false,
  version: 0,
  source: null,
  index: null,
  async load() {
    const meta = async <T,>(key: string) => (await db.meta.get(key))?.value as T | undefined;
    const version = (await meta<number>('catalogVersion')) ?? 0;
    if (version === 0) { set({ loaded: true, version: 0, index: null, source: null }); return; }
    const [meds, institutions, synonyms, source] = await Promise.all([
      db.medications.toArray() as unknown as Promise<CatalogMedication[]>,
      meta<Institution[]>('institutions'),
      meta<Record<string, string>>('synonyms'),
      meta<string | null>('catalogSource'),
    ]);
    set({ loaded: true, version, source: source ?? null, index: buildIndex(meds, institutions ?? [], synonyms ?? {}) });
  },
}));
