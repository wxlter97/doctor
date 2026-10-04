import Dexie, { type EntityTable } from 'dexie';

export interface MetaRow { key: string; value: unknown }
export interface SettingRow { key: string; value: unknown }
export interface MedicationRow {
  id: string; genericName: string; activeIngredients: string[]; atcCode?: string; institutionIds: string[];
  [k: string]: unknown;
}
export interface ShiftTypeRow { id: string; name: string; [k: string]: unknown }
export interface ShiftRow { id: string; start: string; end: string; typeId: string }
export interface FavoriteRow { kind: 'medication' | 'calculator'; refId: string }
export interface RecentRow { kind: 'medication' | 'calculator'; refId: string; usedAt: number }
export interface CalcHistoryRow { id?: number; calculatorId: string; createdAt: number; input: unknown; output: unknown }

export class MedApoyoDB extends Dexie {
  meta!: EntityTable<MetaRow, 'key'>;
  medications!: EntityTable<MedicationRow, 'id'>;
  shiftTypes!: EntityTable<ShiftTypeRow, 'id'>;
  shifts!: EntityTable<ShiftRow, 'id'>;
  favorites!: Dexie.Table<FavoriteRow, [string, string]>;
  recents!: Dexie.Table<RecentRow, [string, string]>;
  calcHistory!: EntityTable<CalcHistoryRow, 'id'>;
  settings!: EntityTable<SettingRow, 'key'>;

  constructor(name = 'medapoyo') {
    super(name);
    this.version(1).stores({
      meta: 'key',
      medications: 'id, genericName, *activeIngredients, atcCode, *institutionIds',
      shiftTypes: 'id, name',
      shifts: 'id, start, end, typeId',
      favorites: '[kind+refId], kind',
      recents: '[kind+refId], usedAt',
      calcHistory: '++id, calculatorId, createdAt',
      settings: 'key',
    });
  }
}

export const db = new MedApoyoDB();

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await db.meta.get(key))?.value as T | undefined;
}
export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value });
}
