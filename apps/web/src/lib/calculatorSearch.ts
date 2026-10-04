import MiniSearch from 'minisearch';
import { calculators, type AnyCalculator } from '@medapoyo/calculators';
import { normalize } from './text';

const index = new MiniSearch<{ id: string; name: string; keywords: string }>({
  fields: ['name', 'keywords'],
  storeFields: ['id'],
  processTerm: normalize,
  searchOptions: { prefix: true, fuzzy: 0.2, processTerm: normalize, boost: { name: 2 } },
});
index.addAll(calculators.map((c) => ({ id: c.id, name: c.name, keywords: c.keywords.join(' ') })));

export function searchCalculators(query: string): AnyCalculator[] {
  const q = query.trim();
  if (!q) return calculators;
  const ids = index.search(q).map((r) => r.id as string);
  return ids.map((id) => calculators.find((c) => c.id === id)!).filter(Boolean);
}
