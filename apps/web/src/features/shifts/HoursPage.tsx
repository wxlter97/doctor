import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { t } from '../../i18n/es-SV';
import { addDays, addMonths, dayLabel, isoToMs, localIso, monthLabel, startOfMonth, startOfWeek, todayInSv } from '../../lib/time';
import { summarize } from './logic';
import { ensureDefaultTypes, useShiftTypes, useShifts } from './store';

export function HoursPage() {
  const s = t.shifts;
  const types = useShiftTypes();
  const shifts = useShifts();
  const [view, setView] = useState<'month' | 'week'>('month');
  const [anchor, setAnchor] = useState(todayInSv());
  useEffect(() => { void ensureDefaultTypes(); }, []);

  const from = view === 'month' ? startOfMonth(anchor) : startOfWeek(anchor);
  const to = view === 'month' ? addMonths(from, 1) : addDays(from, 7);
  const sum = summarize(shifts, types, isoToMs(localIso(from, '00:00')), isoToMs(localIso(to, '00:00')));
  const step = (dir: number) => setAnchor(view === 'month' ? addMonths(from, dir) : addDays(from, 7 * dir));
  const label = view === 'month' ? monthLabel(from) : `${dayLabel(from)} – ${dayLabel(addDays(to, -1))}`;
  const r1 = (n: number) => Math.round(n * 10) / 10;

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <Link to="/turnos" className="inline-flex min-h-11 items-center gap-1 font-bold underline"><ChevronLeft aria-hidden size={18} /> {s.title}</Link>
      <h1 className="text-2xl font-bold">{s.hoursTitle}</h1>
      <div role="radiogroup" aria-label={s.hoursTitle} className="flex gap-2">
        <button role="radio" aria-checked={view === 'month'} className={`btn ${view === 'month' ? 'btn-primary' : ''}`} onClick={() => setView('month')}>{s.byMonth}</button>
        <button role="radio" aria-checked={view === 'week'} className={`btn ${view === 'week' ? 'btn-primary' : ''}`} onClick={() => setView('week')}>{s.byWeek}</button>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn" aria-label={s.prev} onClick={() => step(-1)}><ChevronLeft aria-hidden size={20} /></button>
        <p className="flex-1 text-center font-bold first-letter:uppercase" aria-live="polite">{label}</p>
        <button className="btn" aria-label={s.next} onClick={() => step(1)}><ChevronRight aria-hidden size={20} /></button>
      </div>
      <div className="card flex flex-col gap-3">
        <p className="text-3xl font-black">{r1(sum.totalH)} h</p>
        <p className="font-bold">{s.nights(sum.nightCount)}</p>
        <table className="w-full text-left">
          <thead><tr><th className="py-1">{s.type}</th><th className="py-1 text-right">{s.hours}</th><th className="py-1 text-right">{s.shiftsCount}</th></tr></thead>
          <tbody>
            {types.map((tp) => {
              const b = sum.byType.find((x) => x.typeId === tp.id);
              return <tr key={tp.id} className="border-t-2 border-line"><td className="py-2">{tp.name}{!tp.countsHours && ` (${s.noHours})`}</td><td className="py-2 text-right">{r1(b?.hours ?? 0)}</td><td className="py-2 text-right">{b?.count ?? 0}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
