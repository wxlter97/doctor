import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { t } from '../../i18n/es-SV';
import { dayLabel, datePart, timePart } from '../../lib/time';
import { buildShift } from './logic';
import { deleteShift, saveShift } from './store';
import type { Shift, ShiftType } from './model';

export function DayDialog({ date, shifts, types, rest, onClose }: {
  date: string; shifts: Shift[]; types: ShiftType[]; rest: string[]; onClose: () => void;
}) {
  const s = t.shifts;
  const [error, setError] = useState('');
  const [typeId, setTypeId] = useState(types[0]?.id ?? '');
  const type = types.find((x) => x.id === typeId);
  const [startTime, setStartTime] = useState(type?.startTime ?? '07:00');
  const [durationH, setDurationH] = useState(String(type?.durationH ?? 12));

  const pick = (id: string) => {
    const tp = types.find((x) => x.id === id);
    setTypeId(id);
    if (tp) { setStartTime(tp.startTime); setDurationH(String(tp.durationH)); }
  };
  const add = async () => {
    if (!type) return;
    const dur = Number(durationH);
    if (!Number.isFinite(dur) || dur <= 0 || dur > 48) { setError(s.badDuration); return; }
    const res = await saveShift({ ...buildShift(date, type, { startTime, durationH: dur }) });
    if (res.ok) { setError(''); onClose(); } else setError(s.overlap);
  };

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[var(--on-overlay)]" />
        <Dialog.Content className="card fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-[26rem]">
          <Dialog.Title className="text-xl font-bold first-letter:uppercase">{dayLabel(date)}</Dialog.Title>
          <Dialog.Description className="sr-only">{s.dayDescription}</Dialog.Description>

          {rest.length > 0 && (
            <p className="aviso aviso-warning mt-3 flex gap-2 font-bold" role="status">
              <AlertTriangle aria-hidden size={20} className="shrink-0" /> <span>{rest.join(' ')}</span>
            </p>
          )}

          {shifts.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {shifts.map((sh) => {
                const tp = types.find((x) => x.id === sh.typeId);
                return (
                  <li key={sh.id} className="flex items-center justify-between gap-2 border-2 border-line p-2">
                    <span className="font-bold"><span aria-hidden className="mr-2 inline-block size-3 border border-line" style={{ background: tp?.color }} />{tp?.name} · {timePart(sh.start)}–{timePart(sh.end)}{datePart(sh.end) !== datePart(sh.start) ? ' (+1 d)' : ''}</span>
                    <button className="btn" aria-label={s.deleteShift} onClick={() => void deleteShift(sh.id)}><Trash2 aria-hidden size={18} /></button>
                  </li>
                );
              })}
            </ul>
          )}

          <h3 className="mt-4 font-bold">{s.addShift}</h3>
          <div role="radiogroup" aria-label={s.type} className="mt-2 grid grid-cols-2 gap-2">
            {types.map((tp) => (
              <button key={tp.id} role="radio" aria-checked={tp.id === typeId} onClick={() => pick(tp.id)} className={`btn justify-start ${tp.id === typeId ? 'btn-selected' : ''}`}>
                <span aria-hidden className="inline-block size-3 border border-current" style={{ background: tp.color }} /> {tp.name}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="lbl flex flex-col gap-1">{s.startTime}
              <input className="field" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
            <label className="lbl flex flex-col gap-1">{s.duration}
              <input className="field" inputMode="decimal" value={durationH} onChange={(e) => setDurationH(e.target.value.replace(',', '.'))} />
            </label>
          </div>
          {error && <p role="alert" className="err mt-2">✖ {error}</p>}
          <div className="mt-4 flex gap-2">
            <button className="btn btn-primary" onClick={() => void add()}>{s.save}</button>
            <Dialog.Close className="btn">{t.shortcuts.closeBtn}</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
