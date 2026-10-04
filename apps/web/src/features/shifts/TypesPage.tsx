import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { db, type ShiftTypeRow } from '../../db';
import { t } from '../../i18n/es-SV';
import { shiftTypeSchema, type ShiftType } from './model';
import { ensureDefaultTypes, useShiftTypes, useShifts } from './store';

function TypeEditor({ type, used }: { type: ShiftType; used: boolean }) {
  const s = t.shifts;
  const [draft, setDraft] = useState(type);
  const [msg, setMsg] = useState('');
  const set = <K extends keyof ShiftType>(k: K, v: ShiftType[K]) => { setDraft({ ...draft, [k]: v }); setMsg(''); };
  const save = async () => {
    const r = shiftTypeSchema.safeParse(draft);
    if (!r.success) { setMsg(s.typeInvalid); return; }
    await db.shiftTypes.put(r.data as unknown as ShiftTypeRow);
    setMsg(s.saved);
  };
  const remove = async () => { if (!used) await db.shiftTypes.delete(type.id); };
  const id = `type-${type.id}`;
  return (
    <li className="card flex flex-col gap-3">
      <div className="grid grid-cols-[1fr_5rem] gap-2">
        <label className="flex flex-col gap-1 font-bold">{s.typeName}<input className="field" value={draft.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label className="flex flex-col gap-1 font-bold">{s.typeShort}<input className="field" maxLength={3} value={draft.short} onChange={(e) => set('short', e.target.value)} /></label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1 font-bold">{s.typeColor}<input className="field p-1" type="color" value={draft.color} onChange={(e) => set('color', e.target.value)} /></label>
        <label className="flex flex-col gap-1 font-bold">{s.startTime}<input className="field" type="time" value={draft.startTime} onChange={(e) => set('startTime', e.target.value)} /></label>
        <label className="flex flex-col gap-1 font-bold">{s.duration}<input className="field" inputMode="decimal" value={draft.durationH} onChange={(e) => set('durationH', Number(e.target.value.replace(',', '.')) || 0)} /></label>
      </div>
      <label htmlFor={id} className="flex min-h-11 items-center gap-2 font-bold">
        <input id={id} type="checkbox" className="size-5" checked={draft.countsHours} onChange={(e) => set('countsHours', e.target.checked)} /> {s.countsHours}
      </label>
      {msg && <p role="status" className="font-bold">{msg}</p>}
      <div className="flex items-center gap-2">
        <button className="btn btn-primary" onClick={() => void save()}>{s.save}</button>
        <button className="btn" disabled={used} onClick={() => void remove()}><Trash2 aria-hidden size={18} /> {s.deleteType}</button>
        {used && <span className="text-sm text-muted">{s.typeInUse}</span>}
      </div>
    </li>
  );
}

export function TypesPage() {
  const s = t.shifts;
  const types = useShiftTypes();
  const shifts = useShifts();
  useEffect(() => { void ensureDefaultTypes(); }, []);
  const add = () => db.shiftTypes.put({ id: crypto.randomUUID(), name: s.newType, short: 'N', color: '#2b8a3e', startTime: '07:00', durationH: 12, countsHours: true } as unknown as ShiftTypeRow);
  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <Link to="/turnos" className="inline-flex min-h-11 items-center gap-1 font-bold underline"><ChevronLeft aria-hidden size={18} /> {s.title}</Link>
      <h1 className="text-2xl font-bold">{s.typesTitle}</h1>
      <ul className="flex flex-col gap-4">{types.map((tp) => <TypeEditor key={tp.id + JSON.stringify(tp)} type={tp} used={shifts.some((x) => x.typeId === tp.id)} />)}</ul>
      <button className="btn self-start" onClick={() => void add()}><Plus aria-hidden size={18} /> {s.addType}</button>
    </section>
  );
}
