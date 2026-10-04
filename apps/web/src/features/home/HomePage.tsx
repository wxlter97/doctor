import { useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { getCalculator } from '@medapoyo/calculators';
import { db } from '../../db';
import { RECENTS_MAX } from '../../db/user';
import { searchCalculators } from '../../lib/calculatorSearch';
import { t } from '../../i18n/es-SV';
import { NextShiftCard } from '../shifts/NextShiftCard';

const GROUP_MAX = 5;

export function HomePage() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const calcs = q.trim() ? searchCalculators(q) : [];
  const recents = useLiveQuery(() => db.recents.orderBy('usedAt').reverse().limit(RECENTS_MAX).toArray(), []) ?? [];

  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement && calcs[0]) void navigate(`/calculadoras/${calcs[0].id}`);
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('#global-search, [data-result]')];
    const next = items.indexOf(document.activeElement as HTMLElement) + (e.key === 'ArrowDown' ? 1 : -1);
    if (items[next]) { e.preventDefault(); items[next].focus(); }
  };

  return (
    <section className="flex max-w-3xl flex-col gap-6" onKeyDown={onKey}>
      <h1 className="text-2xl font-bold">{t.home.title}</h1>
      <div className="flex flex-col gap-2">
        <input id="global-search" className="field" type="search" aria-label={t.home.search} placeholder={t.home.search}
          value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        {q.trim() && (
          <div className="card flex flex-col gap-2">
            <h2 className="font-bold">{t.nav.calculators}</h2>
            {calcs.length === 0 && <p>{t.calculators.noResults(q)}</p>}
            <ul className="flex flex-col">
              {calcs.slice(0, GROUP_MAX).map((c) => (
                <li key={c.id}><Link data-result to={`/calculadoras/${c.id}`} className="flex min-h-11 items-center underline">{c.name}</Link></li>
              ))}
            </ul>
            {calcs.length > GROUP_MAX && (
              <Link data-result className="min-h-11 font-bold underline" to={`/calculadoras?q=${encodeURIComponent(q)}`}>{t.home.seeAll}</Link>
            )}
          </div>
        )}
      </div>
      <NextShiftCard />
      <div className="flex flex-col gap-2">
        <h2 className="font-bold">{t.home.recents}</h2>
        {recents.length === 0 && <p className="card text-muted">{t.home.noRecents}</p>}
        <ul className="flex flex-col gap-2">
          {recents.map((r) => {
            const calc = r.kind === 'calculator' ? getCalculator(r.refId) : undefined;
            return calc && (
              <li key={`${r.kind}-${r.refId}`}>
                <Link to={`/calculadoras/${calc.id}`} className="card flex min-h-row items-center py-2 font-bold">{calc.name}</Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
