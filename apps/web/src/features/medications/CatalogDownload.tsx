import { t } from '../../i18n/es-SV';
import { useCatalogUpdate } from './useCatalogUpdate';

export function catalogMessage(r: ReturnType<typeof useCatalogUpdate>['state']): string {
  const c = t.catalog;
  if (r.phase !== 'done') return '';
  switch (r.result.status) {
    case 'updated': return c.updated(r.result.version);
    case 'current': return c.current(r.result.version);
    case 'offline': return c.offline;
    case 'error': return c.error(r.result.message);
  }
}

export function CatalogDownload({ label, onDone }: { label?: string; onDone?: () => void }) {
  const { state, run } = useCatalogUpdate();
  const c = t.catalog;
  const working = state.phase === 'working';
  return (
    <div className="flex flex-col gap-2">
      <button className="btn btn-primary self-start" disabled={working} onClick={() => void run().then(onDone)}>
        {working ? c.downloading : (label ?? c.download)}
      </button>
      {working && <progress className="w-full" max={1} value={state.progress || undefined} aria-label={c.downloading} />}
      <p role="status" className="text-sm font-bold">{catalogMessage(state)}</p>
    </div>
  );
}
