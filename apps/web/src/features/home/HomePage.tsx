import { useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Calculator, Calendar, ChevronRight, Clock, Pill, Search, Star } from 'lucide-react';
import { db } from '../../db';
import { RECENTS_MAX } from '../../db/user';
import { useCalculators } from '../../lib/useCalculators';
import { t } from '../../i18n/es-SV';
import { useCatalog } from '../../stores/catalog';
import { instShort } from '../../lib/institutions';
import { EmptyState, PageHeader } from '../../components/PageHeader';
import { NextShiftCard } from '../shifts/NextShiftCard';

const GROUP_MAX = 5;
/** Calculadoras que más se buscan en guardia: atajos a un toque (ids del registro). */
const QUICK = [
  ['ckd-epi-2021', 'TFG (CKD-EPI)'],
  ['dosis-por-peso', 'Dosis por peso'],
  ['goteo-infusion', 'Goteo'],
  ['glasgow', 'Glasgow'],
  ['imc', 'IMC'],
  ['cha2ds2-vasc', 'CHA2DS2-VASc'],
] as const;

function Tile({ to, icon: Icon, title, hint }: { to: string; icon: typeof Pill; title: string; hint: string }) {
  return (
    <Link to={to} className="row-link flex min-h-20 items-center gap-4 p-3">
      <span className="icon-block icon-block-lg" aria-hidden><Icon size={28} /></span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="display text-lg">{title}</span>
        <span className="text-sm text-muted">{hint}</span>
      </span>
      <ChevronRight aria-hidden size={22} className="shrink-0" />
    </Link>
  );
}

export function HomePage() {
  const h = t.home;
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const index = useCatalog((x) => x.index);
  const calculators = useCalculators();
  const calcs = q.trim() && calculators ? calculators.search(q) : [];
  const meds = q.trim() && index ? index.search(q) : [];
  const recents = useLiveQuery(() => db.recents.orderBy('usedAt').reverse().limit(RECENTS_MAX).toArray(), []) ?? [];

  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      if (meds[0]) void navigate(`/medicamentos/${meds[0].id}`);
      else if (calcs[0]) void navigate(`/calculadoras/${calcs[0].id}`);
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('#global-search, [data-result]')];
    const next = items.indexOf(document.activeElement as HTMLElement) + (e.key === 'ArrowDown' ? 1 : -1);
    if (items[next]) { e.preventDefault(); items[next].focus(); }
  };

  const medsHint = index ? h.medsHint(index.meds.length) : h.medsHintNoCatalog;
  const quick = calculators ? QUICK.filter(([id]) => calculators.get(id)) : QUICK;

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8" onKeyDown={onKey}>
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader eyebrow={t.app.tagline} title={h.title} />

        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search aria-hidden size={20} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input id="global-search" className="field !min-h-14 !pl-11" type="search" aria-label={h.search} placeholder={h.search}
              value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
          </div>
          {q.trim() && index && (
            <div className="card flex flex-col gap-2">
              <h2>{h.medsGroup}</h2>
              {meds.length === 0 && <p>{t.medications.noResults(q)}</p>}
              <ul className="flex flex-col">
                {meds.slice(0, GROUP_MAX).map((m) => (
                  <li key={m.id}><Link data-result to={`/medicamentos/${m.id}`} className="flex min-h-11 flex-wrap items-center gap-x-2 underline">{m.genericName} <span className="text-muted no-underline">{m.strength} · {m.institutions.map((i) => instShort(i.id)).join(', ')}</span></Link></li>
                ))}
              </ul>
              {meds.length > GROUP_MAX && <Link data-result className="min-h-11 font-bold underline" to={`/medicamentos?q=${encodeURIComponent(q)}`}>{h.seeAll}</Link>}
            </div>
          )}
          {q.trim() && (
            <div className="card flex flex-col gap-2">
              <h2>{t.nav.calculators}</h2>
              {calcs.length === 0 && <p>{t.calculators.noResults(q)}</p>}
              <ul className="flex flex-col">
                {calcs.slice(0, GROUP_MAX).map((c) => (
                  <li key={c.id}><Link data-result to={`/calculadoras/${c.id}`} className="flex min-h-11 items-center underline">{c.name}</Link></li>
                ))}
              </ul>
              {calcs.length > GROUP_MAX && (
                <Link data-result className="min-h-11 font-bold underline" to={`/calculadoras?q=${encodeURIComponent(q)}`}>{h.seeAll}</Link>
              )}
            </div>
          )}
        </div>

        <nav aria-label={h.modules} className="grid gap-3">
          <Tile to="/medicamentos" icon={Pill} title={t.nav.medications} hint={medsHint} />
          <Tile to="/calculadoras" icon={Calculator} title={t.nav.calculators} hint={h.calcsHint} />
          <Tile to="/turnos" icon={Calendar} title={t.nav.shifts} hint={h.shiftsHint} />
        </nav>

        <div className="flex flex-col gap-3">
          <div className="section-title"><h2>{h.quick}</h2></div>
          <ul className="flex flex-wrap gap-2">
            {quick.map(([id, label]) => (
              <li key={id}><Link to={`/calculadoras/${id}`} className="btn">{label}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="flex min-w-0 flex-col gap-6" aria-label={h.today}>
        <NextShiftCard />
        <div className="flex flex-col gap-3">
          <div className="section-title"><h2>{h.recents}</h2></div>
          {recents.length === 0 && <EmptyState icon={<Clock size={22} />}>{h.noRecents}</EmptyState>}
          <ul className="flex flex-col gap-2">
            {recents.map((r) => {
              if (r.kind === 'medication') {
                const med = index?.byId.get(r.refId);
                return med && (
                  <li key={`${r.kind}-${r.refId}`}>
                    <Link to={`/medicamentos/${med.id}`} className="row-link flex min-h-row items-center gap-3 px-3 py-2">
                      <span className="icon-block" aria-hidden><Pill size={20} /></span>
                      <span className="flex min-w-0 flex-col"><strong className="truncate">{med.genericName}</strong><span className="truncate text-sm text-muted">{med.form} · {med.strength}</span></span>
                    </Link>
                  </li>
                );
              }
              const calc = calculators?.get(r.refId);
              return calc && (
                <li key={`${r.kind}-${r.refId}`}>
                  <Link to={`/calculadoras/${calc.id}`} className="row-link flex min-h-row items-center gap-3 px-3 py-2">
                    <span className="icon-block" aria-hidden><Calculator size={20} /></span>
                    <strong className="min-w-0">{calc.name}</strong>
                  </Link>
                </li>
              );
            })}
          </ul>
          <FavoritesLink />
        </div>
      </aside>
    </section>
  );
}

/** Acceso a favoritos solo si hay alguno (los favoritos viven en Medicamentos y Calculadoras). */
function FavoritesLink() {
  const n = useLiveQuery(() => db.favorites.count(), []) ?? 0;
  if (n === 0) return null;
  return (
    <p className="flex items-center gap-2 text-sm text-muted"><Star aria-hidden size={16} fill="currentColor" /> {t.home.favoritesNote(n)}</p>
  );
}
