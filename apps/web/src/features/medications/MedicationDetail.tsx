import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, Star } from 'lucide-react';
import { db } from '../../db';
import { toggleFavorite, touchRecent } from '../../db/user';
import { t } from '../../i18n/es-SV';
import { instShort } from '../../lib/institutions';
import { useCatalog } from '../../stores/catalog';
import { Section } from '../calculators/Section';

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

  return (
    <article className="flex max-w-3xl flex-col gap-4 pb-4">
      <Link to={{ pathname: '/medicamentos', search }} className="inline-flex min-h-11 items-center gap-1 font-bold underline lg:hidden"><ChevronLeft aria-hidden size={18} /> {m.title}</Link>
      <header className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">{med.genericName}</h1>
          <p className="text-muted">{med.form} · {med.strength}{med.route ? ` · ${med.route}` : ''}</p>
          <p className="flex flex-wrap gap-1">{med.institutions.map((i) => <span key={i.id} className="border-2 border-line px-1.5 text-xs font-black">{instShort(i.id)}</span>)}</p>
        </div>
        <button className="btn shrink-0" aria-pressed={!!isFav} aria-label={isFav ? m.unfavorite : m.favorite} onClick={() => void toggleFavorite('medication', id)}>
          <Star aria-hidden size={20} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </header>

      <section className="card flex flex-col gap-3">
        <h2 className="font-bold">{m.officialList}</h2>
        <ul className="flex flex-col gap-2">
          {med.institutions.map((i) => {
            const inst = index?.institutions.find((x) => x.id === i.id);
            return (
              <li key={i.id} className="border-2 border-line p-2">
                <p className="font-bold">{inst?.name ?? instShort(i.id)}{inst?.listName ? ` · ${inst.listName}` : ''}</p>
                <p className="text-sm">{m.inList}</p>
                {i.code && <p className="text-sm">{m.code}: {i.code}</p>}
                {i.careLevel && <p className="text-sm">{m.careLevel}: {i.careLevel}</p>}
                {i.presentation && <p className="text-sm">{m.presentation}: {i.presentation}</p>}
              </li>
            );
          })}
        </ul>
        <p className="text-sm font-bold">{m.notStock}</p>
      </section>

      {clinical && sections.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold">{m.aemps}</p>
          {sections.map(([title, text]) => <Section key={title} title={title}><p className="whitespace-pre-wrap">{text}</p></Section>)}
          <p className="text-sm text-muted">{m.source}: {clinical.source}{clinical.sourceRef ? ` · ${clinical.sourceRef}` : ''} · {clinical.retrievedAt}</p>
          {clinical.reviewed && <p className="font-bold">✔ {m.reviewed}</p>}
        </div>
      ) : (
        <p className="card text-muted">{m.noClinical}</p>
      )}
    </article>
  );
}
