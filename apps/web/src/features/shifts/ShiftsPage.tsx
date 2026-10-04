import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, ChevronLeft, ChevronRight, Paintbrush, Repeat, Undo2 } from 'lucide-react';
import { t } from '../../i18n/es-SV';
import { addDays, addMonths, datePart, diffDays, isoToMs, localIso, monthLabel, startOfMonth, startOfWeek, timePart, todayInSv, dayLabel } from '../../lib/time';
import { DayDialog } from './DayDialog';
import { ExportPanel } from './ExportPanel';
import { PatternDialog } from './PatternDialog';
import { buildShift, restWarnings, summarize } from './logic';
import { REST_DEFAULT_H, deleteShift, ensureDefaultTypes, saveShift, useSetting, useShiftTypes, useShifts } from './store';
import type { Shift, ShiftType } from './model';
import { db, type ShiftRow } from '../../db';

const WEEK = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
interface UndoOp { removed: Shift[]; added: Shift[] }

export function ShiftsPage() {
  const s = t.shifts;
  const types = useShiftTypes();
  const shifts = useShifts();
  const threshold = useSetting<number>('restThresholdHours', REST_DEFAULT_H);
  const today = todayInSv();
  const [month, setMonth] = useState(startOfMonth(today));
  const [selected, setSelected] = useState<string | null>(null);
  const [brush, setBrush] = useState<{ on: boolean; typeId: string }>({ on: false, typeId: '' });
  const [undo, setUndo] = useState<UndoOp | null>(null);
  const [pattern, setPattern] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => { void ensureDefaultTypes(); }, []);
  const typeById = useMemo(() => new Map(types.map((x) => [x.id, x])), [types]);

  const byDay = useMemo(() => {
    const m = new Map<string, Shift[]>();
    for (const sh of shifts) m.set(datePart(sh.start), [...(m.get(datePart(sh.start)) ?? []), sh]);
    return m;
  }, [shifts]);

  // Avisos de descanso por día (se muestran en el día del turno que empieza con poco descanso).
  const restByDay = useMemo(() => {
    const m = new Map<string, string[]>();
    const byId = new Map(shifts.map((x) => [x.id, x]));
    for (const w of restWarnings(shifts, types, threshold)) {
      const next = byId.get(w.nextId);
      if (!next) continue;
      const d = datePart(next.start);
      m.set(d, [...(m.get(d) ?? []), s.restWarning(Math.round(w.gapH * 10) / 10, threshold)]);
    }
    return m;
  }, [shifts, types, threshold, s]);

  const first = startOfMonth(month);
  const gridStart = startOfWeek(first);
  const weeks = Math.ceil((diffDays(gridStart, addMonths(first, 1)) ) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i));

  const range: [number, number] = [isoToMs(localIso(first, '00:00')), isoToMs(localIso(addMonths(first, 1), '00:00'))];
  const sum = summarize(shifts, types, range[0], range[1]);
  const monthShifts = shifts.filter((x) => isoToMs(x.end) > range[0] && isoToMs(x.start) < range[1]).sort((a, b) => isoToMs(a.start) - isoToMs(b.start));

  const applyBrush = async (date: string, toggle: boolean) => {
    const type = typeById.get(brush.typeId);
    if (!type) return;
    const existing = byDay.get(date) ?? [];
    if (existing.some((x) => x.typeId === type.id)) {
      if (!toggle) return;
      await Promise.all(existing.map((x) => deleteShift(x.id)));
      setUndo({ removed: existing, added: [] });
      return;
    }
    await Promise.all(existing.map((x) => deleteShift(x.id)));
    const res = await saveShift(buildShift(date, type));
    if (!res.ok) {
      await db.shifts.bulkPut(existing as ShiftRow[]);
      setNotice(s.overlap);
      return;
    }
    setNotice('');
    setUndo({ removed: existing, added: [res.shift] });
  };
  const doUndo = async () => {
    if (!undo) return;
    await Promise.all(undo.added.map((x) => deleteShift(x.id)));
    await db.shifts.bulkPut(undo.removed as ShiftRow[]);
    setUndo(null);
  };

  const onDayClick = (d: string) => (brush.on ? void applyBrush(d, true) : setSelected(d));
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const delta = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[e.key];
    const cur = (document.activeElement as HTMLElement | null)?.dataset.date;
    if (!delta || !cur) return;
    const target = e.currentTarget.querySelector<HTMLElement>(`[data-date="${addDays(cur, delta)}"]`);
    if (target) { e.preventDefault(); target.focus(); }
  };

  const brushType = typeById.get(brush.typeId);

  return (
    <section className="flex max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-bold">{s.title}</h1>

      <div className="flex items-center gap-2">
        <button className="btn" aria-label={s.prevMonth} onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft aria-hidden size={20} /></button>
        <h2 className="min-w-0 flex-1 text-center text-base font-bold first-letter:uppercase lg:text-lg" aria-live="polite">{monthLabel(month)}</h2>
        <button className="btn" aria-label={s.nextMonth} onClick={() => setMonth(addMonths(month, 1))}><ChevronRight aria-hidden size={20} /></button>
        <button className="btn px-3" onClick={() => setMonth(startOfMonth(today))}>{s.today}</button>
      </div>

      <div className="flex flex-wrap gap-2 [&>.btn]:px-3 [&>.btn]:text-sm lg:[&>.btn]:px-4 lg:[&>.btn]:text-base">
        {!brush.on ? (
          <button className="btn" onClick={() => setBrush({ on: true, typeId: brush.typeId || types[0]?.id || '' })}><Paintbrush aria-hidden size={18} /> {s.brush}</button>
        ) : (
          <button className="btn btn-primary" onClick={() => { setBrush({ ...brush, on: false }); setNotice(''); }}>{s.done}</button>
        )}
        <button className="btn" disabled={!undo} onClick={() => void doUndo()}><Undo2 aria-hidden size={18} /> {s.undo}</button>
        <button className="btn" onClick={() => setPattern(true)}><Repeat aria-hidden size={18} /> {s.repeat}</button>
      </div>

      {brush.on && (
        <div role="radiogroup" aria-label={s.type} className="flex flex-wrap gap-2">
          {types.map((tp) => (
            <button key={tp.id} role="radio" aria-checked={tp.id === brush.typeId} className={`btn ${tp.id === brush.typeId ? 'btn-primary' : ''}`} onClick={() => setBrush({ on: true, typeId: tp.id })}>
              <span aria-hidden className="inline-block size-3 border border-current" style={{ background: tp.color }} /> {tp.name}
            </button>
          ))}
          <p className="w-full text-sm text-muted">{s.brushHelp(brushType?.name ?? '')}</p>
        </div>
      )}
      {notice && <p role="alert" className="font-bold text-danger">✖ {notice}</p>}

      <div role="grid" aria-label={monthLabel(month)} onKeyDown={onKey} className="grid grid-cols-7 gap-1">
        {WEEK.map((d, i) => <div key={i} role="columnheader" className="py-1 text-center text-sm font-bold">{d}</div>)}
        {cells.map((d) => {
          const list = byDay.get(d) ?? [];
          const inMonth = d.slice(0, 7) === first.slice(0, 7);
          const warn = restByDay.has(d);
          const label = `${dayLabel(d)}${list.length ? `: ${list.map((x) => typeById.get(x.typeId)?.name).join(', ')}` : ''}${warn ? '. ' + s.restShort : ''}`;
          return (
            <button
              key={d} data-date={d} role="gridcell" aria-label={label}
              onClick={() => onDayClick(d)}
              onPointerEnter={(e) => { if (brush.on && e.buttons === 1) void applyBrush(d, false); }}
              className={`flex min-h-14 flex-col items-stretch gap-0.5 border-2 p-1 text-left text-sm ${d === today ? 'border-4 border-line font-black' : 'border-line'} ${inMonth ? 'bg-surface' : 'bg-surface-2 text-muted'}`}
            >
              <span className="flex items-center justify-between">{Number(d.slice(8))}{warn && <AlertTriangle aria-hidden size={14} />}</span>
              {list.map((x) => {
                const tp = typeById.get(x.typeId);
                return <span key={x.id} className="truncate border border-black px-1 text-center text-xs font-black text-black" style={{ background: tp?.color }}>{tp?.short}</span>;
              })}
            </button>
          );
        })}
      </div>

      <div className="card flex flex-col gap-2">
        <h2 className="font-bold">{s.monthTotals}</h2>
        <p>{s.hoursTotal(Math.round(sum.totalH * 10) / 10)} · {s.nights(sum.nightCount)}</p>
        <ul className="text-sm">
          {sum.byType.map((b) => <li key={b.typeId}>{typeById.get(b.typeId)?.name}: {Math.round(b.hours * 10) / 10} h ({b.count})</li>)}
        </ul>
        <Link className="min-h-11 py-2 font-bold underline" to="/turnos/horas">{s.hoursLink}</Link>
        <Link className="min-h-11 py-2 font-bold underline" to="/turnos/tipos">{s.typesLink}</Link>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-bold">{s.monthList}</h2>
        {monthShifts.length === 0 && <p className="card text-muted">{s.empty}</p>}
        <ul className="flex flex-col gap-2">
          {monthShifts.map((x) => {
            const tp = typeById.get(x.typeId) as ShiftType | undefined;
            const d = datePart(x.start);
            return (
              <li key={x.id}>
                <button className="card flex w-full flex-col items-start py-2 text-left" onClick={() => setSelected(d)}>
                  <span className="font-bold first-letter:uppercase">{dayLabel(d)}</span>
                  <span>{tp?.name} · {timePart(x.start)}–{timePart(x.end)}</span>
                  {restByDay.get(d)?.map((m) => <span key={m} className="flex gap-1 text-sm font-bold text-warning"><AlertTriangle aria-hidden size={16} /> {m}</span>)}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <ExportPanel shifts={shifts} types={types} />

      {selected && <DayDialog date={selected} shifts={byDay.get(selected) ?? []} types={types} rest={restByDay.get(selected) ?? []} onClose={() => setSelected(null)} />}
      {pattern && <PatternDialog types={types} onClose={() => setPattern(false)} />}
    </section>
  );
}
