import { Link } from 'react-router';
import { t } from '../../i18n/es-SV';
import { useCatalog } from '../../stores/catalog';
import { sources } from './sources';

export function SourcesPage() {
  const s = t.sources;
  const version = useCatalog((x) => x.version);
  const source = useCatalog((x) => x.source);
  return (
    <article className="flex max-w-3xl flex-col gap-4 pb-4">
      <h1 className="text-2xl font-bold">{s.title}</h1>
      <p className="aviso aviso-warning text-sm font-bold" role="note">{s.notOfficial}</p>
      <p>{s.intro}</p>
      <p className="text-sm text-muted">{version > 0 ? s.catalogState(version, source) : s.noCatalog}</p>

      <section className="flex flex-col gap-3" aria-labelledby="src-lists">
        <h2 id="src-lists" className="text-xl font-bold">{s.listsTitle}</h2>
        {sources.map((x) => (
          <div key={x.id} className="card flex flex-col gap-2">
            <h3 className="text-lg font-bold">{x.name}</h3>
            <p className="font-bold">{x.list}</p>
            <p className="text-sm">{x.edition} · {x.date}</p>
            <p className="text-sm"><strong>{s.license}:</strong> {x.license}</p>
            <p className="text-sm"><strong>{s.processing}:</strong> {x.processing}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">{x.caveats.map((c) => <li key={c}>{c}</li>)}</ul>
            <a className="inline-flex min-h-11 items-center font-bold underline underline-offset-2" href={x.url} target="_blank" rel="noopener noreferrer">{s.original}: {x.urlLabel}</a>
          </div>
        ))}
      </section>

      <section className="card flex flex-col gap-2" aria-labelledby="src-calc">
        <h2 id="src-calc" className="text-xl font-bold">{s.calcTitle}</h2>
        <p className="text-sm">{s.calcBody}</p>
        <Link className="inline-flex min-h-11 items-center font-bold underline underline-offset-2" to="/calculadoras">{s.calcLink}</Link>
      </section>

      <section className="card flex flex-col gap-2" aria-labelledby="src-missing">
        <h2 id="src-missing" className="text-xl font-bold">{s.missingTitle}</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">{s.missing.map((m) => <li key={m}>{m}</li>)}</ul>
      </section>

      <section className="card flex flex-col gap-2" aria-labelledby="src-free">
        <h2 id="src-free" className="text-xl font-bold">{s.freeTitle}</h2>
        <p className="text-sm">{s.freeBody}</p>
      </section>

      <p className="text-sm text-muted">{s.report}</p>
    </article>
  );
}
