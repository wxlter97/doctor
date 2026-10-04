import { defineCalculator, fmt } from '../helpers';
import { HEIGHT_UNITS, WEIGHT_UNITS } from './units';

interface In { peso: number; talla: number; metodo: 'mosteller' | 'dubois' }

export const bsaCalc = ({ peso, talla, metodo }: In) =>
  metodo === 'dubois'
    ? 0.007184 * peso ** 0.425 * talla ** 0.725
    : Math.sqrt((talla * peso) / 3600);

export const bsa = defineCalculator<In, number>({
  id: 'bsa',
  name: 'Superficie corporal',
  copyName: 'SC',
  category: 'antropometria',
  keywords: ['superficie corporal', 'bsa', 'mosteller', 'dubois', 'quimioterapia'],
  population: 'todos',
  inputs: [
    { kind: 'number', id: 'peso', label: 'Peso', copy: 'peso {v}', unit: 'kg', units: WEIGHT_UNITS, min: 0.5, max: 500 },
    { kind: 'number', id: 'talla', label: 'Talla', copy: 'talla {v}', unit: 'cm', units: HEIGHT_UNITS, min: 30, max: 250 },
    {
      kind: 'choice', id: 'metodo', label: 'Fórmula', default: 'mosteller',
      options: [{ value: 'mosteller', label: 'Mosteller' }, { value: 'dubois', label: 'DuBois' }],
    },
  ],
  compute: bsaCalc,
  present: (v) => ({ value: fmt(v, 2), unit: 'm²', precise: String(v) }),
  formula: 'Mosteller: SC (m²) = √(talla (cm) × peso (kg) / 3600)\nDuBois: SC (m²) = 0.007184 × peso (kg)^0.425 × talla (cm)^0.725',
  references: [
    { citation: 'Mosteller RD. Simplified calculation of body-surface area. N Engl J Med. 1987;317(17):1098.', doi: '10.1056/NEJM198710223171717' },
    { citation: 'Du Bois D, Du Bois EF. A formula to estimate the approximate surface area if height and weight be known. Arch Intern Med. 1916;17:863-871.' },
  ],
});
