import { db, type CalcHistoryRow } from './index';

export type Kind = 'medication' | 'calculator';
export const HISTORY_MAX = 200;
export const RECENTS_MAX = 8;

export async function toggleFavorite(kind: Kind, refId: string) {
  const existing = await db.favorites.get([kind, refId]);
  if (existing) await db.favorites.delete([kind, refId]);
  else await db.favorites.put({ kind, refId });
}

export async function touchRecent(kind: Kind, refId: string) {
  await db.recents.put({ kind, refId, usedAt: Date.now() });
  const old = await db.recents.orderBy('usedAt').reverse().offset(RECENTS_MAX * 3).primaryKeys();
  if (old.length) await db.recents.bulkDelete(old);
}

/** Guarda un cálculo (solo valores numéricos) y conserva los últimos 200. */
export async function addHistory(row: Omit<CalcHistoryRow, 'id'>) {
  await db.calcHistory.add(row);
  const extra = (await db.calcHistory.count()) - HISTORY_MAX;
  if (extra > 0) {
    const ids = await db.calcHistory.orderBy('createdAt').limit(extra).primaryKeys();
    await db.calcHistory.bulkDelete(ids);
  }
}

export const clearHistory = () => db.calcHistory.clear();
