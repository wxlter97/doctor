import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { clearHistory } from '../../db/user';
import { t } from '../../i18n/es-SV';
import { usePrefs, type Density, type Theme } from '../../stores/prefs';
import { avisoLegal } from './legal/aviso-legal';

function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: [T, string][]; onChange: (v: T) => void;
}) {
  return (
    <fieldset className="card">
      <legend className="px-1 font-bold">{label}</legend>
      <div role="radiogroup" className="mt-2 flex flex-wrap gap-2">
        {options.map(([v, text]) => (
          <button key={v} role="radio" aria-checked={value === v} onClick={() => onChange(v)}
            className={`btn ${value === v ? 'btn-primary' : ''}`}>{text}</button>
        ))}
      </div>
    </fieldset>
  );
}

export function SettingsPage() {
  const { theme, density, setTheme, setDensity } = usePrefs();
  const s = t.settings;
  const historyCount = useLiveQuery(() => db.calcHistory.count(), []) ?? 0;
  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">{s.title}</h1>
      <Segmented<Theme> label={s.theme} value={theme} onChange={setTheme}
        options={[['system', s.themeSystem], ['light', s.themeLight], ['dark', s.themeDark]]} />
      <Segmented<Density> label={s.density} value={density} onChange={setDensity}
        options={[['comfortable', s.densityComfortable], ['compact', s.densityCompact]]} />
      <div className="card flex flex-col gap-2">
        <h2 className="font-bold">{s.historyTitle}</h2>
        <p className="text-sm">{s.historyBody}</p>
        <p className="text-sm font-bold">{s.historyCount(historyCount)}</p>
        <button className="btn self-start" disabled={historyCount === 0} onClick={() => void clearHistory()}>{s.historyClear}</button>
      </div>
      <div className="card">
        <h2 className="font-bold">{s.legal}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{avisoLegal.map((p) => <li key={p}>{p}</li>)}</ul>
      </div>
      <p className="text-sm text-muted">{s.version}: {import.meta.env.VITE_APP_VERSION}</p>
    </section>
  );
}
