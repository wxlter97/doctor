import { describe, expect, it } from 'vitest';
import { DEFAULT_TYPES, type Shift } from './model';
import { buildShift, exportBackup, findOverlap, nextShift, parseBackup, patternDates, restWarnings, summarize } from './logic';
import { toIcs } from './ics';
import { isoToMs, localIso, msToIso } from '../../lib/time';

const T = Object.fromEntries(DEFAULT_TYPES.map((t) => [t.id, t]));
let n = 0;
const mk = (date: string, typeId: string): Shift => ({ id: `s${n++}`, ...buildShift(date, T[typeId]!) });

describe('turnos que cruzan la medianoche', () => {
  it('nocturno 19:00–07:00 termina al día siguiente, con zona -06:00', () => {
    const s = buildShift('2026-03-10', T.nocturno!);
    expect(s.start).toBe('2026-03-10T19:00:00-06:00');
    expect(s.end).toBe('2026-03-11T07:00:00-06:00');
  });
  it('24 h 07:00–07:00 y cruce de fin de mes/año', () => {
    expect(buildShift('2026-12-31', T['24h']!).end).toBe('2027-01-01T07:00:00-06:00');
  });
  it('msToIso e isoToMs son inversos y no dependen de la zona del dispositivo', () => {
    const iso = localIso('2026-06-01', '23:30');
    expect(msToIso(isoToMs(iso))).toBe(iso);
    expect(msToIso(Date.UTC(2026, 0, 1, 5, 0))).toBe('2025-12-31T23:00:00-06:00');
  });
});

describe('solapamiento', () => {
  it('diurno + nocturno el mismo día no se solapan (borde exacto)', () => {
    expect(findOverlap([mk('2026-03-10', 'diurno')], DEFAULT_TYPES, buildShift('2026-03-10', T.nocturno!))).toBeUndefined();
  });
  it('nocturno del día 10 solapa con diurno del día 11 si se mueve la hora', () => {
    const existing = mk('2026-03-10', 'nocturno');
    const cand = buildShift('2026-03-11', T.diurno!, { startTime: '06:00' });
    expect(findOverlap([existing], DEFAULT_TYPES, cand)?.id).toBe(existing.id);
  });
  it('un 24 h solapa con un diurno ese día', () => {
    expect(findOverlap([mk('2026-03-10', '24h')], DEFAULT_TYPES, buildShift('2026-03-10', T.diurno!))).toBeDefined();
  });
  it('al editar, ignora el propio turno; post-guardia nunca bloquea', () => {
    const s = mk('2026-03-10', 'diurno');
    expect(findOverlap([s], DEFAULT_TYPES, { ...s })).toBeUndefined();
    expect(findOverlap([mk('2026-03-10', '24h')], DEFAULT_TYPES, buildShift('2026-03-11', T['post-guardia']!))).toBeUndefined();
  });
});

describe('descanso insuficiente', () => {
  it('24 h seguido de diurno a las 07:00 → 0 h de descanso', () => {
    const a = mk('2026-03-10', '24h');
    const b = mk('2026-03-11', 'diurno');
    expect(restWarnings([a, b], DEFAULT_TYPES, 12)).toEqual([{ prevId: a.id, nextId: b.id, gapH: 0 }]);
  });
  it('umbral configurable: 12 h de descanso exactos no avisan con 12, sí con 13', () => {
    const a = mk('2026-03-10', 'diurno'); // termina 19:00
    const b = { id: 'x', ...buildShift('2026-03-11', T.diurno!) }; // empieza 07:00 → 12 h
    expect(restWarnings([a, b], DEFAULT_TYPES, 12)).toHaveLength(0);
    expect(restWarnings([a, b], DEFAULT_TYPES, 13)).toHaveLength(1);
  });
  it('post-guardia no cuenta', () => {
    expect(restWarnings([mk('2026-03-10', '24h'), mk('2026-03-11', 'post-guardia')], DEFAULT_TYPES, 12)).toHaveLength(0);
  });
});

describe('patrones repetitivos', () => {
  it('cada 3 días, extremos incluidos', () => {
    expect(patternDates({ mode: 'everyN', from: '2026-03-01', to: '2026-03-10', n: 3 })).toEqual(['2026-03-01', '2026-03-04', '2026-03-07', '2026-03-10']);
  });
  it('por días de la semana (lunes y jueves)', () => {
    // 2026-03-02 es lunes
    expect(patternDates({ mode: 'weekdays', from: '2026-03-01', to: '2026-03-12', days: [1, 4] })).toEqual(['2026-03-02', '2026-03-05', '2026-03-09', '2026-03-12']);
  });
  it('rango invertido o n inválido → vacío', () => {
    expect(patternDates({ mode: 'everyN', from: '2026-03-10', to: '2026-03-01', n: 2 })).toEqual([]);
    expect(patternDates({ mode: 'everyN', from: '2026-03-01', to: '2026-03-05', n: 0 })).toEqual([]);
  });
});

describe('conteo de horas', () => {
  const month = (m: string): [number, number] => [isoToMs(localIso(`${m}-01`, '00:00')), isoToMs(localIso(`${m}-01`, '00:00')) + 31 * 86_400_000];
  it('suma por tipo y cuenta nocturnas y 24 h', () => {
    const shifts = [mk('2026-03-02', 'diurno'), mk('2026-03-04', 'nocturno'), mk('2026-03-08', '24h'), mk('2026-03-10', 'post-guardia')];
    const [f] = month('2026-03');
    const r = summarize(shifts, DEFAULT_TYPES, f, f + 31 * 86_400_000);
    expect(r.totalH).toBe(12 + 12 + 24);
    expect(r.nightCount).toBe(2);
    expect(r.byType.find((t) => t.typeId === 'diurno')).toMatchObject({ hours: 12, count: 1 });
  });
  it('un turno que cruza el fin de mes reparte las horas', () => {
    const s = mk('2026-03-31', 'nocturno'); // 19:00 → 07:00 del 1 de abril
    const mar = summarize([s], DEFAULT_TYPES, isoToMs(localIso('2026-03-01', '00:00')), isoToMs(localIso('2026-04-01', '00:00')));
    const apr = summarize([s], DEFAULT_TYPES, isoToMs(localIso('2026-04-01', '00:00')), isoToMs(localIso('2026-05-01', '00:00')));
    expect(mar.totalH).toBe(5);
    expect(apr.totalH).toBe(7);
    expect(mar.nightCount).toBe(1);
    expect(apr.nightCount).toBe(0);
  });
});

describe('.ics', () => {
  const shifts = [mk('2026-03-10', 'nocturno'), mk('2026-03-12', 'post-guardia'), mk('2026-04-20', 'diurno')];
  it('un evento por turno dentro del rango, con VALARM configurable', () => {
    const ics = toIcs(shifts, DEFAULT_TYPES, { from: '2026-03-01', to: '2026-03-31' }, 60);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain('SUMMARY:Turno Nocturno');
    expect(ics).toContain('DTSTART:20260311T010000Z'); // 19:00 -06:00 = 01:00 UTC del día siguiente
    expect(ics).toContain('DTEND:20260311T130000Z');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toMatch(/TRIGGER:-PT60M/);
  });
  it('alarma 120 min y sin alarma', () => {
    expect(toIcs(shifts, DEFAULT_TYPES, { from: '2026-03-01', to: '2026-03-31' }, 120)).toMatch(/TRIGGER:-PT120M/);
    expect(toIcs(shifts, DEFAULT_TYPES, { from: '2026-03-01', to: '2026-03-31' }, 0)).not.toContain('VALARM');
  });
});

describe('respaldo JSON', () => {
  it('exporta e importa sin pérdida', () => {
    const shifts = [mk('2026-03-10', 'nocturno'), mk('2026-03-12', 'diurno')];
    const json = JSON.stringify(exportBackup(DEFAULT_TYPES, shifts));
    const r = parseBackup(json);
    expect(r.ok && r.data.types).toEqual(DEFAULT_TYPES);
    expect(r.ok && r.data.shifts).toEqual(shifts);
  });
  it('rechaza JSON roto, esquema inválido y tipos huérfanos', () => {
    expect(parseBackup('{no').ok).toBe(false);
    expect(parseBackup('{"app":"otra"}').ok).toBe(false);
    const bad = exportBackup(DEFAULT_TYPES, [{ id: 'z', start: '2026-03-10T07:00:00-06:00', end: '2026-03-10T19:00:00-06:00', typeId: 'nope' }]);
    expect(parseBackup(JSON.stringify(bad))).toMatchObject({ ok: false });
    const inverted = exportBackup(DEFAULT_TYPES, [{ id: 'z', start: '2026-03-10T19:00:00-06:00', end: '2026-03-10T07:00:00-06:00', typeId: 'diurno' }]);
    expect(parseBackup(JSON.stringify(inverted)).ok).toBe(false);
  });
});

describe('próximo turno', () => {
  const shifts = [mk('2026-03-10', 'diurno'), mk('2026-03-12', 'diurno')];
  it('en curso, próximo y ninguno', () => {
    const during = isoToMs(localIso('2026-03-10', '10:00'));
    expect(nextShift(shifts, DEFAULT_TYPES, during)).toMatchObject({ inProgress: true, shift: { id: shifts[0]!.id } });
    const between = isoToMs(localIso('2026-03-11', '10:00'));
    expect(nextShift(shifts, DEFAULT_TYPES, between)).toMatchObject({ inProgress: false, shift: { id: shifts[1]!.id } });
    expect(nextShift(shifts, DEFAULT_TYPES, isoToMs(localIso('2026-04-01', '00:00')))).toBeUndefined();
  });
});
