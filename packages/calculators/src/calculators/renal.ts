import { defineCalculator, fmt } from '../helpers';
import { CREATININE_UNITS, SEX_OPTIONS, WEIGHT_UNITS } from './units';

interface CkdIn { creatinina: number; edad: number; sexo: 'f' | 'm' }

export function ckdEpi2021Egfr({ creatinina, edad, sexo }: CkdIn): number {
  const kappa = sexo === 'f' ? 0.7 : 0.9;
  const alpha = sexo === 'f' ? -0.241 : -0.302;
  const r = creatinina / kappa;
  return 142 * Math.min(r, 1) ** alpha * Math.max(r, 1) ** -1.2 * 0.9938 ** edad * (sexo === 'f' ? 1.012 : 1);
}

export function estadioG(egfr: number): { label: string; severity: 'info' | 'warning' | 'danger' } {
  if (egfr >= 90) return { label: 'G1', severity: 'info' };
  if (egfr >= 60) return { label: 'G2', severity: 'info' };
  if (egfr >= 45) return { label: 'G3a', severity: 'warning' };
  if (egfr >= 30) return { label: 'G3b', severity: 'warning' };
  if (egfr >= 15) return { label: 'G4', severity: 'danger' };
  return { label: 'G5', severity: 'danger' };
}

const creatininaInput = {
  kind: 'number', id: 'creatinina', label: 'Creatinina sérica', copy: 'Cr {v}', unit: 'mg/dL',
  units: CREATININE_UNITS, min: 0.2, max: 20,
} as const;

export const ckdEpi2021 = defineCalculator<CkdIn, number>({
  id: 'ckd-epi-2021',
  name: 'TFG CKD-EPI 2021 (sin coeficiente de raza)',
  copyName: 'CKD-EPI 2021',
  category: 'renal',
  keywords: ['tfg', 'filtrado glomerular', 'egfr', 'ckd-epi', 'creatinina', 'renal', 'erc'],
  population: 'adulto',
  inputs: [
    creatininaInput,
    { kind: 'number', id: 'edad', label: 'Edad', copy: '{v}', unit: 'años', min: 18, max: 120, integer: true },
    { kind: 'choice', id: 'sexo', label: 'Sexo', options: SEX_OPTIONS },
  ],
  compute: ckdEpi2021Egfr,
  interpret: estadioG,
  present: (v) => ({ value: fmt(v), unit: 'mL/min/1.73 m²', precise: `${v}` }),
  formula:
    'TFG = 142 × mín(Cr/κ, 1)^α × máx(Cr/κ, 1)^−1.200 × 0.9938^edad × 1.012 [si es mujer]\nκ = 0.7 (mujer) · 0.9 (hombre); α = −0.241 (mujer) · −0.302 (hombre)\nCr en mg/dL.',
  references: [
    { citation: 'Inker LA, et al. New creatinine- and cystatin C–based equations to estimate GFR without race. N Engl J Med. 2021;385(19):1737-1749.', doi: '10.1056/NEJMoa2102953' },
  ],
  warnings: [
    'Solo para adultos (≥ 18 años).',
    'Supone función renal estable: no es válida en lesión renal aguda.',
    'Estadios G según KDIGO; para clasificar la ERC también hace falta la albuminuria.',
  ],
});

interface CgIn { edad: number; peso: number; creatinina: number; sexo: 'f' | 'm' }

export const cockcroftGaultClcr = ({ edad, peso, creatinina, sexo }: CgIn) =>
  ((140 - edad) * peso) / (72 * creatinina) * (sexo === 'f' ? 0.85 : 1);

export const cockcroftGault = defineCalculator<CgIn, number>({
  id: 'cockcroft-gault',
  name: 'Aclaramiento de creatinina (Cockcroft-Gault)',
  copyName: 'Cockcroft-Gault',
  category: 'renal',
  keywords: ['aclaramiento', 'creatinina', 'cockcroft', 'gault', 'clcr', 'ajuste de dosis'],
  population: 'adulto',
  inputs: [
    { kind: 'number', id: 'edad', label: 'Edad', copy: '{v}', unit: 'años', min: 18, max: 120, integer: true },
    { kind: 'number', id: 'peso', label: 'Peso', copy: 'peso {v}', unit: 'kg', units: WEIGHT_UNITS, min: 20, max: 400 },
    creatininaInput,
    { kind: 'choice', id: 'sexo', label: 'Sexo', options: SEX_OPTIONS },
  ],
  compute: cockcroftGaultClcr,
  present: (v) => ({ value: fmt(v), unit: 'mL/min', precise: `${v}` }),
  formula: 'ClCr (mL/min) = (140 − edad) × peso (kg) / (72 × Cr (mg/dL))   × 0.85 si es mujer',
  references: [
    { citation: 'Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16(1):31-41.', doi: '10.1159/000180580' },
  ],
  warnings: [
    'Usa el peso real; en obesidad o desnutrición evaluá usar peso ideal o ajustado.',
    'Supone función renal estable. Verificá la ficha del fármaco para saber qué estimación usa para ajustar la dosis.',
  ],
});
