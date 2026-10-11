import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, FileText, Star } from 'lucide-react';
import { db } from '../../db';
import { toggleFavorite, touchRecent } from '../../db/user';
import { t } from '../../i18n/es-SV';
import { instShort } from '../../lib/institutions';
import { useCatalog } from '../../stores/catalog';
import { Section } from '../calculators/Section';
import { EmptyState } from '../../components/PageHeader';

export function MedicationDetail() {
  const m = t.medications;
  const { id = '' } = useParams();
  const { search } = useLocation();
  const index = useCatalog((s) => s.index);
  const med = index?.byId.get(id);
  const isFav = useLiveQuery(async () => !!(await db.favorites.get(['medication', id])), [id]);
  useEffect(() => { if (med) void touchRecent('medication', id); }, [med, id]);

  if (!med) return <p className="card">{m.notFound} <Link className="underline" to={{ pathname: '/medicamentos', search }}>{m.title}</Link></p>;
  const clinical = med.clinical;
  const sections = clinical ? ([
    [m.indications, clinical.indications], [m.dosage, clinical.dosage], [m.contraindications, clinical.contraindications],
    [m.warnings, clinical.warnings], [m.interactions, clinical.interactions], [m.pregnancy, clinical.pregnancyLactation],
  ] as const).filter(([, v]) => !!v) : [];

  const names: Record<string, string> = { minsal: 'MINSAL', isss: 'ISSS', fosalud: 'FOSALUD' };
  const shortSources = med.institutions.map((i) => names[i.id] ?? instShort(i.id)).join(', ');
  return (
    <article className="flex max-w-3xl flex-col gap-5 pb-4">
      <Link to={{ pathname: '/medicamentos', search }} className="inline-flex min-h-11 items-center gap-1 font-bold underline lg:hidden"><ChevronLeft aria-hidden size={18} /> {m.title}</Link>
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          {med.therapeuticGroup && <p className="eyebrow">{med.therapeuticGroup}{med.atcCode ? ` · ATC ${med.atcCode}` : ''}</p>}
          <h1>{med.genericName}</h1>
          <p className="text-lg"><strong>{med.strength}</strong> <span className="text-muted">· {med.form}{med.route ? ` · ${med.route}` : ''}</span></p>
          <p className="flex flex-wrap gap-1">{med.institutions.map((i) => <span key={i.id} className="tag">{instShort(i.id)}</span>)}</p>
        </div>
        <button className={`btn shrink-0 ${isFav ? 'btn-selected' : ''}`} aria-pressed={!!isFav} aria-label={isFav ? m.unfavorite : m.favorite} onClick={() => void toggleFavorite('medication', id)}>
          <Star aria-hidden size={20} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </header>

      <section className="flex flex-col gap-3" aria-labelledby="official-list">
        <div className="section-title"><h2 id="official-list">{m.officialList}</h2></div>
        <ul className="flex flex-col gap-3">
          {med.institutions.map((i) => {
            const inst = index?.institutions.find((x) => x.id === i.id);
            return (
              <li key={i.id} className="card flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="tag">{instShort(i.id)}</span>
                  <p className="min-w-0 flex-1 font-bold">{inst?.name ?? instShort(i.id)}</p>
                </div>
                <dl className="kv">
                  {inst?.listName && <><dt>Listado</dt><dd>{inst.listName}{inst.listEdition ? ` · ${inst.listEdition}` : ''}</dd></>}
                  {i.code && <><dt>{m.code}</dt><dd className="font-mono">{i.code}</dd></>}
                  {i.careLevel && <><dt>{m.careLevel}</dt><dd>{i.careLevel}</dd></>}
                  {i.presentation && <><dt>{m.presentation}</dt><dd>{i.presentation}</dd></>}
                </dl>
                {i.notes && <p className="aviso aviso-warning text-sm"><strong>{m.restriction}:</strong> {i.notes}</p>}
              </li>
            );
          })}
        </ul>
        <p className="aviso text-sm font-bold">{m.notStock}</p>
        <div className="flex flex-col gap-1 text-sm text-muted">
          <p>{m.sourceShort(shortSources)} <Link className="inline-flex min-h-11 items-center font-bold text-fg underline underline-offset-2" to="/fuentes">{m.sourcesLink}</Link></p>
          <details>
            <summary className="flex min-h-11 cursor-pointer items-center font-bold text-fg">{m.sourceDetails}</summary>
            <div className="flex flex-col gap-2 pb-2">
              {med.institutions.some((i) => i.id === 'minsal') && <p>{m.sourceMinsal}</p>}
              {med.institutions.some((i) => i.id === 'isss') && <p>{m.sourceIsss}</p>}
              {med.institutions.some((i) => i.id === 'fosalud') && <p>{m.sourceFosalud}</p>}
            </div>
          </details>
        </div>
      </section>

      {clinical && sections.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold">{m.aemps}</p>
          {sections.map(([title, text]) => <Section key={title} title={title}><p className="whitespace-pre-wrap">{text}</p></Section>)}
          <p className="text-sm text-muted">{m.source}: {clinical.source}{clinical.sourceRef ? ` · ${clinical.sourceRef}` : ''} · {clinical.retrievedAt}</p>
          {clinical.reviewed && <p className="font-bold">✔ {m.reviewed}</p>}
        </div>
      ) : (
        <EmptyState icon={<FileText size={22} />}>
          <p className="font-bold text-fg">{m.noClinicalTitle}</p>
          <p className="text-sm">{m.noClinical}</p>
        </EmptyState>
      )}
    </article>
  );
}
