import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Link, Outlet, useLocation, useMatch, useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { SlidersHorizontal, Star } from 'lucide-react';
import type { CatalogMedication } from '@medapoyo/shared';
import { db } from '../../db';
import { t } from '../../i18n/es-SV';
import { instShort } from '../../lib/institutions';
import { useCatalog } from '../../stores/catalog';
import { CatalogDownload } from './CatalogDownload';
import { FiltersDialog } from './FiltersDialog';

const MAX_RESULTS = 100;
const NO_IDS: string[] = [];

export function MedicationRow({ med, fav, search }: { med: CatalogMedication; fav: boolean; search: string }) {
  return (
    <li>
      <Link data-result to={{ pathname: `/medicamentos/${med.id}`, search }} className="card flex min-h-row flex-col gap-1 py-2">
        <span className="flex items-center justify-between gap-2">
          <strong className="text-lg">{med.genericName}</strong>
          {fav && <Star aria-label={t.medications.favorite} size={18} fill="currentColor" />}
        </span>
        <span className="text-muted">{med.form} · {med.strength}</span>
        <span className="flex flex-wrap gap-1">
          {med.institutions.map((i) => <span key={i.id} className="tag">{instShort(i.id)}</span>)}
        </span>
      </Link>
    </li>
  );
}

export function MedicationsLayout() {
  const m = t.medications;
  const { loaded, index, source } = useCatalog();
  const [params, setParams] = useSearchParams();
  const { search: locSearch } = useLocation();
  const detailOpen = !!useMatch('/medicamentos/:id');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = params.get('q') ?? '';
  const insts = useMemo(() => (params.get('inst') ?? '').split(',').filter(Boolean), [params]);
  const form = params.get('form') ?? undefined;
  const group = params.get('group') ?? undefined;
  const [text, setText] = useState(q);

  // Debounce de 100 ms entre lo que se escribe y la búsqueda.
  useEffect(() => {
    const id = setTimeout(() => {
      if (text === q) return;
      setParams((p) => { const n = new URLSearchParams(p); if (text) n.set('q', text); else n.delete('q'); return n; }, { replace: true });
    }, 100);
    return () => clearTimeout(id);
  }, [text, q, setParams]);

  const update = (patch: Record<string, string | undefined>) =>
    setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(patch)) { if (v) n.set(k, v); else n.delete(k); } return n; }, { replace: true });
  const toggleInst = (id: string) => update({ inst: (insts.includes(id) ? insts.filter((x) => x !== id) : [...insts, id]).join(',') || undefined });

  const results = useMemo(() => index?.search(q, { institutions: insts, form, group }) ?? [], [index, q, insts, form, group]);
  const favIds = useLiveQuery(() => db.favorites.where('kind').equals('medication').toArray().then((r) => r.map((f) => f.refId)), []) ?? NO_IDS;
  const favs = !q && index ? favIds.map((id) => index.byId.get(id)).filter((x): x is CatalogMedication => !!x) : [];
  const advanced = (form ? 1 : 0) + (group ? 1 : 0);
  const filtered = !!q || insts.length > 0 || advanced > 0;

  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('#med-search, [data-result]')];
    const next = items.indexOf(document.activeElement as HTMLElement) + (e.key === 'ArrowDown' ? 1 : -1);
    if (items[next]) { e.preventDefault(); items[next].focus(); }
  };

  return (
    <div className="lg:grid lg:h-full lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-6">
      <section className={`${detailOpen ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col gap-3 lg:overflow-y-auto`} onKeyDown={onKey}>
        <h1 className="text-2xl font-bold">{m.title}</h1>
        {source === 'PARCIAL' && <p role="note" className="aviso aviso-warning text-sm font-bold">{m.partialBanner}</p>}
        {source === 'FIXTURE' && <p role="note" className="aviso aviso-warning text-sm font-bold">{m.fixtureBanner}</p>}
        {loaded && !index ? (
          <div className="card flex flex-col gap-3">
            <p>{m.noCatalog}</p>
            <CatalogDownload />
          </div>
        ) : (
          <>
            <input id="med-search" className="field" type="search" autoComplete="off" aria-label={m.search} placeholder={m.search} value={text} onChange={(e) => setText(e.target.value)} />
            <div className="flex flex-wrap items-center gap-2">
              {(index?.institutions ?? []).map((i) => (
                <button key={i.id} aria-pressed={insts.includes(i.id)} onClick={() => toggleInst(i.id)} className={`btn ${insts.includes(i.id) ? 'btn-selected' : ''}`}>{instShort(i.id)}</button>
              ))}
              <button className="btn" onClick={() => setFiltersOpen(true)}><SlidersHorizontal aria-hidden size={18} /> {m.filters}{advanced > 0 && <span className="border-2 border-current px-1.5 text-xs">{advanced}</span>}</button>
            </div>
            {filtered && (
              <div className="flex flex-wrap items-center gap-2" aria-label={m.activeFilters}>
                {[...(form ? [[m.form, form, () => update({ form: undefined })] as const] : []), ...(group ? [[m.group, group, () => update({ group: undefined })] as const] : [])].map(([label, value, clear]) => (
                  <button key={label} className="btn min-h-11 text-sm" onClick={clear} aria-label={m.removeFilter(label, value)}>{value} ✕</button>
                ))}
                <button className="min-h-11 font-bold underline" onClick={() => { setText(''); setParams({}, { replace: true }); }}>{m.clear}</button>
              </div>
            )}
            <p className="text-sm text-muted">{m.notStock}</p>
            {favs.length > 0 && (
              <div className="flex flex-col gap-2">
                <h2 className="font-bold">{m.favorites}</h2>
                <ul className="flex flex-col gap-2">{favs.map((x) => <MedicationRow key={x.id} med={x} fav search={locSearch} />)}</ul>
              </div>
            )}
            {index && results.length === 0 && <p className="card">{m.noResults(q)}</p>}
            <p className="sr-only" aria-live="polite">{m.resultsCount(results.length)}</p>
            <ul className="flex flex-col gap-2">
              {results.slice(0, MAX_RESULTS).map((x) => <MedicationRow key={x.id} med={x} fav={favIds.includes(x.id)} search={locSearch} />)}
            </ul>
            {results.length > MAX_RESULTS && <p className="text-sm text-muted">{m.showingFirst(MAX_RESULTS, results.length)}</p>}
          </>
        )}
      </section>
      <div className={`${detailOpen ? 'block' : 'hidden lg:block'} min-h-0 lg:overflow-y-auto`}><Outlet /></div>
      {filtersOpen && index && (
        <FiltersDialog forms={index.forms} groups={index.groups} form={form} group={group} onClose={() => setFiltersOpen(false)} onChange={(n) => update({ form: n.form, group: n.group })} />
      )}
    </div>
  );
}

export function MedicationsIndexPlaceholder() {
  return <p className="card text-muted">{t.medications.pick}</p>;
}
