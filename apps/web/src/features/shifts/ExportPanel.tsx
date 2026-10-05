import { useState } from 'react';
import { Download } from 'lucide-react';
import { t } from '../../i18n/es-SV';
import { addDays, startOfMonth, todayInSv } from '../../lib/time';
import { download } from '../../lib/download';
import { ALARM_DEFAULT_MIN, setSetting, useSetting } from './store';
import type { Shift, ShiftType } from './model';

export function ExportPanel({ shifts, types }: { shifts: Shift[]; types: ShiftType[] }) {
  const s = t.shifts;
  const today = todayInSv();
  const [from, setFrom] = useState(startOfMonth(today));
  const [to, setTo] = useState(addDays(startOfMonth(today), 30));
  const alarm = useSetting<number>('alarmMinutes', ALARM_DEFAULT_MIN);
  const [msg, setMsg] = useState('');

  const run = async () => {
    if (to < from) { setMsg(s.badRange); return; }
    const { toIcs } = await import('./ics');
    const ics = toIcs(shifts, types, { from, to }, alarm);
    download('turnos.ics', ics, 'text/calendar');
    setMsg('');
  };

  return (
    <section className="card flex flex-col gap-3">
      <h2 className="text-lg font-bold">{s.exportIcs}</h2>
      <p className="text-sm text-muted">{s.exportHelp}</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="lbl flex flex-col gap-1">{s.from}<input className="field" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="lbl flex flex-col gap-1">{s.to}<input className="field" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      </div>
      <label className="lbl flex flex-col gap-1">{s.alarmBefore}
        <input className="field" inputMode="numeric" value={alarm} onChange={(e) => void setSetting('alarmMinutes', Math.max(0, Math.min(1440, Number(e.target.value) || 0)))} />
      </label>
      {msg && <p role="alert" className="err">✖ {msg}</p>}
      <button className="btn btn-primary self-start" onClick={() => void run()}><Download aria-hidden size={18} /> {s.exportBtn}</button>
    </section>
  );
}
