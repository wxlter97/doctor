import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { t } from '../../i18n/es-SV';
import { todayInSv } from '../../lib/time';
import { buildShift, patternDates, type Pattern } from './logic';
import { saveShift } from './store';
import type { ShiftType } from './model';

const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export function PatternDialog({ types, onClose }: { types: ShiftType[]; onClose: () => void }) {
  const s = t.shifts;
  const [typeId, setTypeId] = useState(types[0]?.id ?? '');
  const [mode, setMode] = useState<'everyN' | 'weekdays'>('everyN');
  const [from, setFrom] = useState(todayInSv());
  const [to, setTo] = useState(todayInSv());
  const [n, setN] = useState('3');
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [msg, setMsg] = useState('');

  const apply = async () => {
    const type = types.find((x) => x.id === typeId);
    if (!type) return;
    const pattern: Pattern = mode === 'everyN' ? { mode, from, to, n: Number(n) } : { mode, from, to, days };
    const dates = patternDates(pattern);
    if (dates.length === 0) { setMsg(s.patternEmpty); return; }
    let created = 0;
    for (const d of dates) if ((await saveShift(buildShift(d, type))).ok) created++;
    const skipped = dates.length - created;
    setMsg(s.patternDone(created, skipped));
  };

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="card fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:w-[28rem] lg:-translate-x-1/2 lg:-translate-y-1/2">
          <Dialog.Title className="text-xl font-bold">{s.repeat}</Dialog.Title>
          <Dialog.Description className="mb-3 text-sm text-muted">{s.patternHelp}</Dialog.Description>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 font-bold">{s.type}
              <select className="field" value={typeId} onChange={(e) => setTypeId(e.target.value)}>{types.map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}</select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 font-bold">{s.from}<input className="field" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
              <label className="flex flex-col gap-1 font-bold">{s.to}<input className="field" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
            </div>
            <div role="radiogroup" aria-label={s.patternMode} className="flex gap-2">
              <button role="radio" aria-checked={mode === 'everyN'} className={`btn ${mode === 'everyN' ? 'btn-primary' : ''}`} onClick={() => setMode('everyN')}>{s.everyN}</button>
              <button role="radio" aria-checked={mode === 'weekdays'} className={`btn ${mode === 'weekdays' ? 'btn-primary' : ''}`} onClick={() => setMode('weekdays')}>{s.byWeekday}</button>
            </div>
            {mode === 'everyN' ? (
              <label className="flex flex-col gap-1 font-bold">{s.everyNLabel}<input className="field" inputMode="numeric" value={n} onChange={(e) => setN(e.target.value)} /></label>
            ) : (
              <div className="flex gap-1" role="group" aria-label={s.byWeekday}>
                {DAYS.map((d, i) => (
                  <button key={i} aria-pressed={days.includes(i)} className={`btn flex-1 px-0 ${days.includes(i) ? 'btn-primary' : ''}`}
                    onClick={() => setDays((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]))}>{d}</button>
                ))}
              </div>
            )}
            {msg && <p role="status" className="font-bold">{msg}</p>}
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={() => void apply()}>{s.generate}</button>
              <Dialog.Close className="btn">{t.shortcuts.closeBtn}</Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
