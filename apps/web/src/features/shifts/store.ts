import { useLiveQuery } from 'dexie-react-hooks';
import { db, type ShiftRow, type ShiftTypeRow } from '../../db';
import { findOverlap } from './logic';
import { DEFAULT_TYPES, type Shift, type ShiftType } from './model';

export const REST_DEFAULT_H = 12;
export const ALARM_DEFAULT_MIN = 60;

/** Siembra los tipos precargados solo la primera vez (si el usuario borra todos, no vuelven). */
export async function ensureDefaultTypes() {
  const seeded = await db.meta.get('shiftTypesSeeded');
  if (seeded) return;
  await db.transaction('rw', db.shiftTypes, db.meta, async () => {
    if ((await db.shiftTypes.count()) === 0) await db.shiftTypes.bulkPut(DEFAULT_TYPES as unknown as ShiftTypeRow[]);
    await db.meta.put({ key: 'shiftTypesSeeded', value: true });
  });
}

// Resultados por defecto estables (misma referencia) para no invalidar useMemo mientras carga.
const NO_TYPES: ShiftType[] = [];
const NO_SHIFTS: Shift[] = [];
export const useShiftTypes = () => useLiveQuery(() => db.shiftTypes.toArray() as unknown as Promise<ShiftType[]>, [], NO_TYPES);
export const useShifts = () => useLiveQuery(() => db.shifts.toArray() as Promise<Shift[]>, [], NO_SHIFTS);

export function useSetting<T>(key: string, fallback: T): T {
  return useLiveQuery(async () => ((await db.settings.get(key))?.value as T | undefined) ?? fallback, [key], fallback) ?? fallback;
}
export const setSetting = (key: string, value: unknown) => db.settings.put({ key, value });

export type SaveResult = { ok: true; shift: Shift } | { ok: false; error: string };

/** Guarda un turno; los solapes bloquean. */
export async function saveShift(shift: Omit<Shift, 'id'> & { id?: string }): Promise<SaveResult> {
  const [shifts, types] = await Promise.all([db.shifts.toArray() as Promise<Shift[]>, db.shiftTypes.toArray() as unknown as Promise<ShiftType[]>]);
  const clash = findOverlap(shifts, types, shift);
  if (clash) return { ok: false, error: 'overlap' };
  const row: Shift = { ...shift, id: shift.id ?? crypto.randomUUID() };
  await db.shifts.put(row as ShiftRow);
  return { ok: true, shift: row };
}
export const deleteShift = (id: string) => db.shifts.delete(id);

export async function replaceAllData(types: ShiftType[], shifts: Shift[]) {
  await db.transaction('rw', db.shiftTypes, db.shifts, db.meta, async () => {
    await db.shiftTypes.clear();
    await db.shifts.clear();
    await db.shiftTypes.bulkPut(types as unknown as ShiftTypeRow[]);
    await db.shifts.bulkPut(shifts as ShiftRow[]);
    await db.meta.put({ key: 'shiftTypesSeeded', value: true });
  });
}
