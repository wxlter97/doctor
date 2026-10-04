import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './index';
import { addHistory, clearHistory, HISTORY_MAX, toggleFavorite } from './user';

beforeEach(async () => { await db.calcHistory.clear(); await db.favorites.clear(); });

describe('historial', () => {
  it('conserva máximo 200 entradas y elimina las más antiguas', async () => {
    for (let i = 0; i < HISTORY_MAX + 5; i++) {
      await addHistory({ calculatorId: 'imc', createdAt: i, input: { i }, output: {} });
    }
    expect(await db.calcHistory.count()).toBe(HISTORY_MAX);
    const oldest = await db.calcHistory.orderBy('createdAt').first();
    expect(oldest?.createdAt).toBe(5);
  });
  it('se borra por completo', async () => {
    await addHistory({ calculatorId: 'imc', createdAt: 1, input: {}, output: {} });
    await clearHistory();
    expect(await db.calcHistory.count()).toBe(0);
  });
});

describe('favoritos', () => {
  it('alterna', async () => {
    await toggleFavorite('calculator', 'imc');
    expect(await db.favorites.count()).toBe(1);
    await toggleFavorite('calculator', 'imc');
    expect(await db.favorites.count()).toBe(0);
  });
});
