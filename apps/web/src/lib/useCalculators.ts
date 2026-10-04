import { useEffect, useState } from 'react';
import type { AnyCalculator } from '@medapoyo/calculators';

export interface CalculatorModule {
  search: (q: string) => AnyCalculator[];
  get: (id: string) => AnyCalculator | undefined;
}

let cache: Promise<CalculatorModule> | null = null;

/** Carga el registro de calculadoras (con zod) y su buscador fuera del arranque. */
export const loadCalculators = () =>
  (cache ??= Promise.all([import('./calculatorSearch'), import('@medapoyo/calculators')]).then(([s, c]) => ({ search: s.searchCalculators, get: c.getCalculator })));

export function useCalculators(): CalculatorModule | null {
  const [mod, setMod] = useState<CalculatorModule | null>(null);
  useEffect(() => {
    let alive = true;
    // Tras el primer pintado: no compite con el LCP.
    const idle = (window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200)));
    idle(() => void loadCalculators().then((m) => alive && setMod(m)));
    return () => { alive = false; };
  }, []);
  return mod;
}
