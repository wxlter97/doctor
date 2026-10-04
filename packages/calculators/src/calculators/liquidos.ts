import { defineCalculator, fmt } from '../helpers';
import { WEIGHT_UNITS } from './units';

interface In { peso: number }
interface Out { mlDia: number; mlHora: number }

export function hollidaySegar(peso: number): Out {
  const mlDia = peso <= 10 ? peso * 100 : peso <= 20 ? 1000 + (peso - 10) * 50 : 1500 + (peso - 20) * 20;
  return { mlDia, mlHora: mlDia / 24 };
}

export const holliday = defineCalculator<In, Out>({
  id: 'holliday-segar',
  name: 'Líquidos de mantenimiento (Holliday-Segar)',
  copyName: 'Holliday-Segar',
  category: 'liquidos',
  keywords: ['holliday', 'segar', 'mantenimiento', 'liquidos', 'hidratacion', 'pediatria', '4-2-1'],
  population: 'pediatrico',
  inputs: [{ kind: 'number', id: 'peso', label: 'Peso', copy: 'peso {v}', unit: 'kg', units: WEIGHT_UNITS, min: 3, max: 200 }],
  compute: ({ peso }) => hollidaySegar(peso),
  present: (o) => ({
    value: fmt(o.mlDia),
    unit: 'mL/día',
    extra: [`Velocidad: ${fmt(o.mlHora, 1)} mL/h`],
    precise: `${o.mlDia} mL/día · ${o.mlHora} mL/h`,
  }),
  formula:
    'Primeros 10 kg: 100 mL/kg/día\nSiguientes 10 kg (10–20): 50 mL/kg/día\nPor cada kg sobre 20: 20 mL/kg/día\n(equivale a la regla 4-2-1 en mL/h)',
  references: [
    { citation: 'Holliday MA, Segar WE. The maintenance need for water in parenteral fluid therapy. Pediatrics. 1957;19(5):823-832.' },
  ],
  warnings: [
    'Calcula mantenimiento, no déficit ni pérdidas continuas.',
    'No aplica a recién nacidos en los primeros días de vida.',
    'En pacientes de mayor peso, verificá el protocolo: el total diario suele limitarse.',
  ],
});
