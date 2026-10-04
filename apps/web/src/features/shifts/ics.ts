import { createEvents, type EventAttributes } from 'ics';
import { addDays, isoToMs, localIso } from '../../lib/time';
import type { Shift, ShiftType } from './model';

// Módulo aparte: `ics` (y su dependencia yup) solo se carga al exportar, no en el arranque.
const counts = (types: ShiftType[], s: Shift) => types.find((t) => t.id === s.typeId)?.countsHours ?? true;
const typeOf = (types: ShiftType[], id: string) => types.find((t) => t.id === id);

/** Exporta a .ics: un evento por turno con alarma. Devuelve el contenido del archivo. */
export function toIcs(shifts: Shift[], types: ShiftType[], range: { from: string; to: string }, alarmMin: number): string {
  const [fromMs, toMs] = [isoToMs(localIso(range.from, '00:00')), isoToMs(localIso(addDays(range.to, 1), '00:00'))];
  const events: EventAttributes[] = shifts
    .filter((s) => counts(types, s) && isoToMs(s.start) >= fromMs && isoToMs(s.start) < toMs)
    .sort((a, b) => isoToMs(a.start) - isoToMs(b.start))
    .map((s) => {
      const st = new Date(isoToMs(s.start));
      const en = new Date(isoToMs(s.end));
      const arr = (d: Date) => [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()] as [number, number, number, number, number];
      return {
        uid: `${s.id}@medapoyo`,
        title: `Turno ${typeOf(types, s.typeId)?.name ?? ''}`.trim(),
        start: arr(st), startInputType: 'utc', startOutputType: 'utc',
        end: arr(en), endInputType: 'utc', endOutputType: 'utc',
        alarms: alarmMin > 0 ? [{ action: 'display', description: 'Turno próximo', trigger: { minutes: alarmMin, before: true } }] : [],
      } satisfies EventAttributes;
    });
  const { error, value } = createEvents(events);
  if (error || !value) throw new Error(`No se pudo generar el .ics: ${String(error)}`);
  return value;
}
