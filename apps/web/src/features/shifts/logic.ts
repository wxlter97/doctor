import { createEvents, type EventAttributes } from 'ics';
import { addDays, DAY, HOUR, datePart, diffDays, isoToMs, localIso, msToIso, weekday, MIN } from '../../lib/time';
import { backupSchema, type Backup, type Shift, type ShiftType } from './model';

const typeOf = (types: ShiftType[], id: string) => types.find((t) => t.id === id);
/** Solo los turnos que cuentan horas participan en solapes, descansos y totales. */
const counts = (types: ShiftType[], s: Shift) => typeOf(types, s.typeId)?.countsHours ?? true;

/** Crea un turno que empieza en `date` a la hora del tipo; puede cruzar la medianoche. */
export function buildShift(date: string, type: ShiftType, opts?: { startTime?: string; durationH?: number }): Omit<Shift, 'id'> {
  const start = localIso(date, opts?.startTime ?? type.startTime);
  const end = msToIso(isoToMs(start) + (opts?.durationH ?? type.durationH) * HOUR);
  return { start, end, typeId: type.id };
}

export const overlaps = (a: Pick<Shift, 'start' | 'end'>, b: Pick<Shift, 'start' | 'end'>) =>
  isoToMs(a.start) < isoToMs(b.end) && isoToMs(b.start) < isoToMs(a.end);

export function findOverlap(shifts: Shift[], types: ShiftType[], candidate: Omit<Shift, 'id'> & { id?: string }): Shift | undefined {
  if (!counts(types, candidate as Shift)) return undefined;
  return shifts.find((s) => s.id !== candidate.id && counts(types, s) && overlaps(s, candidate));
}

export interface RestWarning { prevId: string; nextId: string; gapH: number }
/** Descansos menores al umbral entre turnos consecutivos (aviso, no bloqueo). */
export function restWarnings(shifts: Shift[], types: ShiftType[], thresholdH: number): RestWarning[] {
  const sorted = shifts.filter((s) => counts(types, s)).sort((a, b) => isoToMs(a.start) - isoToMs(b.start));
  const out: RestWarning[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const next = sorted[i]!;
    const gapH = (isoToMs(next.start) - isoToMs(prev.end)) / HOUR;
    if (gapH >= 0 && gapH < thresholdH) out.push({ prevId: prev.id, nextId: next.id, gapH });
  }
  return out;
}

export interface HoursSummary {
  totalH: number;
  nightCount: number;
  byType: { typeId: string; hours: number; count: number }[];
}
const crossesMidnight = (s: Shift) => datePart(s.start) !== datePart(msToIso(isoToMs(s.end) - MIN));
const isNightOr24 = (s: Shift) => isoToMs(s.end) - isoToMs(s.start) >= DAY || crossesMidnight(s);

/** Horas dentro de [fromMs, toMs): un turno que cruza el borde se reparte entre períodos. */
export function summarize(shifts: Shift[], types: ShiftType[], fromMs: number, toMs: number): HoursSummary {
  const map = new Map<string, { hours: number; count: number }>();
  let nightCount = 0;
  for (const s of shifts) {
    if (!counts(types, s)) continue;
    const a = Math.max(isoToMs(s.start), fromMs);
    const b = Math.min(isoToMs(s.end), toMs);
    if (b <= a) continue;
    const cur = map.get(s.typeId) ?? { hours: 0, count: 0 };
    cur.hours += (b - a) / HOUR;
    cur.count += 1;
    map.set(s.typeId, cur);
    const startsHere = isoToMs(s.start) >= fromMs && isoToMs(s.start) < toMs;
    if (startsHere && isNightOr24(s)) nightCount += 1;
  }
  const byType = [...map.entries()].map(([typeId, v]) => ({ typeId, ...v }));
  return { totalH: byType.reduce((n, t) => n + t.hours, 0), nightCount, byType };
}

export type Pattern =
  | { mode: 'everyN'; from: string; to: string; n: number }
  | { mode: 'weekdays'; from: string; to: string; days: number[] };

/** Fechas (YYYY-MM-DD) que genera un patrón, ambos extremos incluidos. */
export function patternDates(p: Pattern): string[] {
  const total = diffDays(p.from, p.to);
  if (total < 0) return [];
  const out: string[] = [];
  for (let i = 0; i <= total; i++) {
    const d = addDays(p.from, i);
    if (p.mode === 'everyN' ? p.n >= 1 && i % p.n === 0 : p.days.includes(weekday(d))) out.push(d);
  }
  return out;
}

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

export function exportBackup(types: ShiftType[], shifts: Shift[], now = new Date()): Backup {
  return { app: 'medapoyo', version: 1, exportedAt: now.toISOString(), types, shifts };
}

export type ParseResult = { ok: true; data: Backup } | { ok: false; error: string };
export function parseBackup(json: string): ParseResult {
  let raw: unknown;
  try { raw = JSON.parse(json); } catch { return { ok: false, error: 'El archivo no es un JSON válido.' }; }
  const r = backupSchema.safeParse(raw);
  if (!r.success) return { ok: false, error: 'El archivo no es un respaldo válido de MedApoyo.' };
  const ids = new Set(r.data.types.map((t) => t.id));
  if (r.data.shifts.some((s) => !ids.has(s.typeId))) return { ok: false, error: 'Hay turnos con un tipo que no existe en el respaldo.' };
  return { ok: true, data: { ...r.data, shifts: r.data.shifts.map((s) => ({ ...s, start: msToIso(isoToMs(s.start)), end: msToIso(isoToMs(s.end)) })) } };
}

export interface NextShift { shift: Shift; type?: ShiftType; inProgress: boolean }
export function nextShift(shifts: Shift[], types: ShiftType[], now: number): NextShift | undefined {
  const real = shifts.filter((s) => counts(types, s)).sort((a, b) => isoToMs(a.start) - isoToMs(b.start));
  const current = real.find((s) => isoToMs(s.start) <= now && now < isoToMs(s.end));
  const s = current ?? real.find((x) => isoToMs(x.start) > now);
  return s && { shift: s, type: typeOf(types, s.typeId), inProgress: !!current };
}
