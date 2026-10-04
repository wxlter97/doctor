import { Link, useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Star } from 'lucide-react';
import { categoryLabels, getCalculator, type AnyCalculator } from '@medapoyo/calculators';
import { db } from '../../db';
import { searchCalculators } from '../../lib/calculatorSearch';
import { t } from '../../i18n/es-SV';

function Row({ calc, fav }: { calc: AnyCalculator; fav?: boolean }) {
  return (
    <li>
      <Link to={`/calculadoras/${calc.id}`} className="card flex min-h-row items-center justify-between gap-2 py-2 font-bold">
        <span>{calc.name}</span>
        {fav && <Star aria-label={t.calculators.favorite} size={18} fill="currentColor" />}
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
    <section className="flex max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-bold">{t.calculators.title}</h1>
      <input
        className="field" type="search" aria-label={t.calculators.search} placeholder={t.calculators.search} value={q}
        onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
      />
      {results.length === 0 && <p className="card">{t.calculators.noResults(q)}</p>}
      {favs.length > 0 && !q && (
        <div className="flex flex-col gap-2">
          <h2 className="font-bold">{t.calculators.favorites}</h2>
          <ul className="flex flex-col gap-2">{favs.map((c) => <Row key={c.id} calc={c} fav />)}</ul>
        </div>
      )}
      {byCategory.map(([cat, list]) => (
        <div key={cat} className="flex flex-col gap-2">
          <h2 className="font-bold">{categoryLabels[cat as keyof typeof categoryLabels]}</h2>
          <ul className="flex flex-col gap-2">{list.map((c) => <Row key={c.id} calc={c} />)}</ul>
        </div>
      ))}
    </section>
  );
}
