import { describe, expect, it } from 'vitest';
import { db, getMeta, setMeta } from './index';

describe('dexie v1', () => {
  it('guarda y lee meta', async () => {
    await setMeta('catalogVersion', 3);
    expect(await getMeta<number>('catalogVersion')).toBe(3);
  });
  it('declara todas las tablas del esquema', () => {
    expect(db.tables.map((t) => t.name).sort()).toEqual(
      ['calcHistory', 'favorites', 'medications', 'meta', 'recents', 'settings', 'shiftTypes', 'shifts'],
    );
  });
});
