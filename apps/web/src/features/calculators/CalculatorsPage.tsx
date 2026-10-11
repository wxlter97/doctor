import { Link, useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Droplet, Search, Star } from 'lucide-react';
import { categoryLabels, getCalculator, type AnyCalculator } from '@medapoyo/calculators';
import { db } from '../../db';
import { searchCalculators } from '../../lib/calculatorSearch';
import { t } from '../../i18n/es-SV';
import { EmptyState, PageHeader } from '../../components/PageHeader';
import { CATEGORY_ICON, POPULATION } from './meta';

function Row({ calc, fav }: { calc: AnyCalculator; fav?: boolean }) {
  const Icon = CATEGORY_ICON[calc.category] ?? Droplet;
  const pop = POPULATION[calc.population];
  return (
    <li>
      <Link to={`/calculadoras/${calc.id}`} className="row-link flex h-full min-h-row items-center gap-3 px-3 py-2">
        <span className="icon-block" aria-hidden><Icon size={22} /></span>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="leading-snug">{calc.name}</strong>
          {pop && <span className="text-xs text-muted">{pop}</span>}
        </span>
        {fav && <Star aria-label={t.calculators.favorite} size={18} fill="currentColor" className="shrink-0" />}
      </Link>
    </li>
  );
}

export function CalculatorsPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const favIds = useLiveQuery(() => db.favorites.where('kind').equals('calculator').toArray().then((r) => r.map((f) => f.refId)), []) ?? [];
  const results = searchCalculators(q);
  const favs = favIds.map(getCalculator).filter((c): c is AnyCalculator => !!c && results.includes(c));
  const groups = new Map<string, AnyCalculator[]>();
  for (const c of results) groups.set(c.category, [...(groups.get(c.category) ?? []), c]);
  const byCategory = [...groups.entries()];

  return (
    <section className="flex max-w-5xl flex-col gap-5">
      <PageHeader eyebrow={t.calculators.count(results.length)} title={t.calculators.title} />
      <div className="relative">
        <Search aria-hidden size={20} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="field !min-h-14 !pl-11" type="search" aria-label={t.calculators.search} placeholder={t.calculators.search} value={q}
          onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
        />
      </div>
      {results.length === 0 && <EmptyState icon={<Search size={22} />}><p>{t.calculators.noResults(q)}</p></EmptyState>}
      {favs.length > 0 && !q && (
        <div className="flex flex-col gap-3">
          <div className="section-title"><h2>{t.calculators.favorites}</h2></div>
          <ul className="grid gap-2 md:grid-cols-2">{favs.map((c) => <Row key={c.id} calc={c} fav />)}</ul>
        </div>
      )}
      {byCategory.map(([cat, list]) => (
        <div key={cat} className="flex flex-col gap-3">
          <div className="section-title">
            <h2>{categoryLabels[cat as keyof typeof categoryLabels]}</h2>
            <span className="eyebrow">{list.length}</span>
          </div>
          <ul className="grid gap-2 md:grid-cols-2">{list.map((c) => <Row key={c.id} calc={c} />)}</ul>
        </div>
      ))}
    </section>
  );
}
