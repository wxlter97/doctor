import MiniSearch from 'minisearch';
import type { CatalogMedication, Institution } from '@medapoyo/shared';
import { normalize } from './text';

export interface Filters { institutions: string[]; form?: string; group?: string }

export interface MedIndex {
  meds: CatalogMedication[];
  byId: Map<string, CatalogMedication>;
  institutions: Institution[];
  forms: string[];
  groups: string[];
  search: (query: string, filters?: Filters) => CatalogMedication[];
}

const byName = (a: CatalogMedication, b: CatalogMedication) =>
  normalize(a.genericName).localeCompare(normalize(b.genericName)) || a.strength.localeCompare(b.strength, 'es', { numeric: true });

/** Índice en memoria sobre el catálogo local. Busca por nombre, principio activo, grupo y sinónimos. */
export function buildIndex(meds: CatalogMedication[], institutions: Institution[], synonyms: Record<string, string>): MedIndex {
  const syn = new Map(Object.entries(synonyms).map(([k, v]) => [normalize(k), normalize(v)]));
  const mini = new MiniSearch<{ id: string; name: string; ingredients: string; terms: string; group: string }>({
    fields: ['name', 'ingredients', 'terms', 'group'],
    storeFields: ['id'],
    processTerm: normalize,
    searchOptions: { prefix: true, fuzzy: 0.2, processTerm: normalize, boost: { name: 3, ingredients: 2, terms: 2 } },
  });
  mini.addAll(meds.map((m) => ({ id: m.id, name: m.genericName, ingredients: m.activeIngredients.join(' '), terms: m.searchTerms.join(' '), group: m.therapeuticGroup ?? '' })));
  const byId = new Map(meds.map((m) => [m.id, m]));
  const sorted = [...meds].sort(byName);
  const uniq = (xs: (string | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, 'es'));

  const passes = (m: CatalogMedication, f?: Filters) =>
    !f || ((f.institutions.length === 0 || f.institutions.some((id) => m.institutions.some((i) => i.id === id)))
      && (!f.form || m.form === f.form) && (!f.group || m.therapeuticGroup === f.group));

  return {
    meds: sorted, byId, institutions,
    forms: uniq(meds.map((m) => m.form)),
    groups: uniq(meds.map((m) => m.therapeuticGroup)),
    search(query, filters) {
      const q = query.trim();
      if (!q) return sorted.filter((m) => passes(m, filters));
      // Cada palabra que sea sinónimo conocido suma su término canónico a la consulta.
      const extra = normalize(q).split(/\s+/).map((w) => syn.get(w)).filter(Boolean);
      const ids = mini.search([q, ...extra].join(' '), { combineWith: 'OR' }).map((r) => r.id as string);
      return ids.map((id) => byId.get(id)!).filter((m) => passes(m, filters));
    },
  };
}
