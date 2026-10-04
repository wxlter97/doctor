import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { clearHistory } from '../../db/user';
import { t } from '../../i18n/es-SV';
import { usePrefs, type Density, type Theme } from '../../stores/prefs';
import { download } from '../../lib/download';
import { exportBackup, parseBackup } from '../shifts/logic';
import { REST_DEFAULT_H, replaceAllData, setSetting, useSetting } from '../shifts/store';
import type { Shift, ShiftType } from '../shifts/model';
import { useState } from 'react';
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
  const rest = useSetting<number>('restThresholdHours', REST_DEFAULT_H);
  const [backupMsg, setBackupMsg] = useState('');
  const doExport = async () => {
    const [types, shifts] = await Promise.all([db.shiftTypes.toArray(), db.shifts.toArray()]);
    download('medapoyo-respaldo.json', JSON.stringify(exportBackup(types as unknown as ShiftType[], shifts as Shift[]), null, 2), 'application/json');
  };
  const doImport = async (file?: File) => {
    if (!file) return;
    const r = parseBackup(await file.text());
    if (!r.ok) { setBackupMsg(r.error); return; }
    if (!window.confirm(s.backupConfirm)) return;
    await replaceAllData(r.data.types, r.data.shifts);
    setBackupMsg(s.backupOk(r.data.shifts.length));
  };
  const historyCount = useLiveQuery(() => db.calcHistory.count(), []) ?? 0;
  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">{s.title}</h1>
      <Segmented<Theme> label={s.theme} value={theme} onChange={setTheme}
        options={[['system', s.themeSystem], ['light', s.themeLight], ['dark', s.themeDark]]} />
      <Segmented<Density> label={s.density} value={density} onChange={setDensity}
        options={[['comfortable', s.densityComfortable], ['compact', s.densityCompact]]} />
      <div className="card flex flex-col gap-2">
        <label htmlFor="rest-threshold" className="font-bold">{s.restThreshold}</label>
        <input id="rest-threshold" className="field max-w-32" inputMode="decimal" value={rest}
          onChange={(e) => void setSetting('restThresholdHours', Math.max(0, Math.min(48, Number(e.target.value.replace(',', '.')) || 0)))} />
        <p className="text-sm text-muted">{s.restThresholdHelp}</p>
      </div>
      <div className="card flex flex-col gap-2">
        <h2 className="font-bold">{s.backupTitle}</h2>
        <p className="text-sm">{s.backupBody}</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => void doExport()}>{s.backupExport}</button>
          <label className="btn cursor-pointer">{s.backupImport}
            <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { void doImport(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>
        {backupMsg && <p role="status" className="font-bold">{backupMsg}</p>}
      </div>
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
