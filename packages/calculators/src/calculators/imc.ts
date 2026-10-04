import { defineCalculator, fmt } from '../helpers';
import { HEIGHT_UNITS, WEIGHT_UNITS } from './units';

interface In { peso: number; talla: number }

export function categoriaImc(imc: number): { label: string; severity: 'info' | 'warning' | 'danger' } {
  if (imc < 18.5) return { label: 'Bajo peso', severity: 'warning' };
  if (imc < 25) return { label: 'Normal', severity: 'info' };
  if (imc < 30) return { label: 'Sobrepeso', severity: 'warning' };
  if (imc < 35) return { label: 'Obesidad grado I', severity: 'danger' };
  if (imc < 40) return { label: 'Obesidad grado II', severity: 'danger' };
  return { label: 'Obesidad grado III', severity: 'danger' };
}

export const imc = defineCalculator<In, number>({
  id: 'imc',
  name: 'Índice de masa corporal (IMC)',
  copyName: 'IMC',
  category: 'antropometria',
  keywords: ['imc', 'bmi', 'peso', 'talla', 'obesidad', 'sobrepeso'],
  population: 'adulto',
  inputs: [
    { kind: 'number', id: 'peso', label: 'Peso', copy: 'peso {v}', unit: 'kg', units: WEIGHT_UNITS, min: 20, max: 500 },
    { kind: 'number', id: 'talla', label: 'Talla', copy: 'talla {v}', unit: 'cm', units: HEIGHT_UNITS, min: 100, max: 250 },
  ],
  compute: ({ peso, talla }) => peso / (talla / 100) ** 2,
  interpret: (v) => categoriaImc(v),
  present: (v) => ({ value: fmt(v, 1), unit: 'kg/m²', precise: String(v) }),
  formula: 'IMC = peso (kg) / talla (m)²',
  references: [
    { citation: 'World Health Organization. Obesity: preventing and managing the global epidemic. WHO Technical Report Series 894. Ginebra: OMS; 2000.' },
  ],
  warnings: ['Categorías de la OMS para adultos. No aplica a niños ni adolescentes (usar percentiles).'],
});
