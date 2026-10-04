import { describe, expect, it } from 'vitest';
import { calculators } from './registry';

describe('referencias', () => {
  it('los DOI tienen formato válido y no se repiten dentro de una calculadora', () => {
    for (const c of calculators) {
      const dois = c.references.map((r) => r.doi).filter((d): d is string => !!d);
      for (const d of dois) expect(d, `${c.id}: ${d}`).toMatch(/^10\.\d{4,9}\/\S+$/);
      expect(new Set(dois).size, c.id).toBe(dois.length);
    }
  });
  it('toda calculadora tiene al menos una referencia, o una nota explícita de que es aritmética/TODO(fuente)', () => {
    for (const c of calculators) {
      const ok = c.references.some((r) => r.doi || /TODO\(fuente\)|Cálculo aritmético|WHO Technical Report|Pugh|Apgar|Holliday/.test(r.citation));
      expect(ok, c.id).toBe(true);
    }
  });
});
