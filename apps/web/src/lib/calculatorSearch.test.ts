import { describe, expect, it } from 'vitest';
import { searchCalculators } from './calculatorSearch';

describe('búsqueda de calculadoras', () => {
  it('ignora tildes y mayúsculas', () => {
    expect(searchCalculators('GLASGOW').map((c) => c.id)).toContain('glasgow');
    expect(searchCalculators('presion arterial').map((c) => c.id)).toContain('pam');
    expect(searchCalculators('Presión').map((c) => c.id)).toContain('pam');
  });
  it('tolera errores menores y prefijos', () => {
    expect(searchCalculators('glasgo').map((c) => c.id)).toContain('glasgow');
    expect(searchCalculators('creatinia').map((c) => c.id)).toContain('ckd-epi-2021');
  });
  it('consulta vacía devuelve todas; sin coincidencias, ninguna', () => {
    expect(searchCalculators('').length).toBeGreaterThan(10);
    expect(searchCalculators('zzzzqqq')).toEqual([]);
  });
});
