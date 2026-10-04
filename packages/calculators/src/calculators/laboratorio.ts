import { defineCalculator, fmt } from '../helpers';
import type { UnitDef } from '../types';

const REF_NOTE = 'El rango de referencia depende del laboratorio: compará con el del tuyo.';
const GLU_UNITS: UnitDef[] = [{ id: 'mg/dL', label: 'mg/dL', factor: 1 }, { id: 'mmol/L', label: 'mmol/L', factor: 18.016 }];
const ALB_UNITS: UnitDef[] = [{ id: 'g/dL', label: 'g/dL', factor: 1 }, { id: 'g/L', label: 'g/L', factor: 0.1 }];

// ── Anion gap ───────────────────────────────────────────────────────────
interface AgIn { na: number; cl: number; hco3: number; alb?: number }
interface AgOut { ag: number; corregido?: number }
export const anionGapCalc = ({ na, cl, hco3, alb }: AgIn): AgOut => {
  const ag = na - (cl + hco3);
  return { ag, corregido: alb !== undefined ? ag + 2.5 * (4 - alb) : undefined };
};
export const anionGap = defineCalculator<AgIn, AgOut>({
  id: 'anion-gap',
  name: 'Anion gap (brecha aniónica)',
  copyName: 'Anion gap',
  category: 'laboratorio',
  keywords: ['anion gap', 'brecha anionica', 'acidosis metabolica', 'albumina', 'electrolitos'],
  population: 'todos',
  inputs: [
    { kind: 'number', id: 'na', label: 'Sodio', copy: 'Na {v}', unit: 'mmol/L', min: 90, max: 190 },
    { kind: 'number', id: 'cl', label: 'Cloro', copy: 'Cl {v}', unit: 'mmol/L', min: 60, max: 150 },
    { kind: 'number', id: 'hco3', label: 'Bicarbonato', copy: 'HCO₃ {v}', unit: 'mmol/L', min: 2, max: 60 },
    { kind: 'number', id: 'alb', label: 'Albúmina (opcional, para corregir)', copy: 'alb {v}', unit: 'g/dL', units: ALB_UNITS, min: 0.5, max: 6, optional: true },
  ],
  compute: anionGapCalc,
  present: (o) => ({ value: fmt(o.ag, 1), unit: 'mmol/L', extra: o.corregido !== undefined ? [`Corregido por albúmina: ${fmt(o.corregido, 1)} mmol/L`] : undefined }),
  formula: 'Anion gap = Na − (Cl + HCO₃)\nCorregido = AG + 2.5 × (4.0 − albúmina en g/dL)',
  references: [
    { citation: 'Emmett M, Narins RG. Clinical use of the anion gap. Medicine (Baltimore). 1977;56(1):38-54.', doi: '10.1097/00005792-197756010-00002' },
    { citation: 'TODO(fuente): verificar el factor 2.5 de la corrección por albúmina con una referencia.' },
  ],
  warnings: [REF_NOTE, 'No incluye potasio.'],
});

// ── Sodio corregido por glucosa ─────────────────────────────────────────
interface NaIn { na: number; glucosa: number; factor: number }
export const sodioCorregidoCalc = ({ na, glucosa, factor }: NaIn) => na + (factor * (glucosa - 100)) / 100;
export const sodioCorregido = defineCalculator<NaIn, number>({
  id: 'sodio-corregido',
  name: 'Sodio corregido por glucosa',
  copyName: 'Na corregido',
  category: 'laboratorio',
  keywords: ['sodio corregido', 'hiperglucemia', 'hiponatremia', 'glucosa', 'katz'],
  population: 'todos',
  inputs: [
    { kind: 'number', id: 'na', label: 'Sodio medido', copy: 'Na {v}', unit: 'mmol/L', min: 90, max: 190 },
    { kind: 'number', id: 'glucosa', label: 'Glucosa', copy: 'glucosa {v}', unit: 'mg/dL', units: GLU_UNITS, min: 20, max: 2000 },
    {
      kind: 'choice', id: 'factor', label: 'Factor de corrección', default: 1.6, copy: 'factor {v}',
      options: [{ value: 1.6, label: '1.6 mmol/L por cada 100 mg/dL (clásico)', copy: '1.6' }, { value: 2.4, label: '2.4 mmol/L por cada 100 mg/dL', copy: '2.4' }],
    },
  ],
  compute: sodioCorregidoCalc,
  present: (v) => ({ value: fmt(v, 1), unit: 'mmol/L', precise: String(v) }),
  formula: 'Na corregido = Na medido + factor × (glucosa − 100) / 100   (glucosa en mg/dL; factor 1.6 o 2.4)',
  references: [
    { citation: 'Katz MA. Hyperglycemia-induced hyponatremia — calculation of expected serum sodium depression. N Engl J Med. 1973;289(16):843-844.', doi: '10.1056/NEJM197310182891607' },
    { citation: 'Hillier TA, et al. Hyperglycemia and hyponatremia: the corrected sodium. Am J Med. 1999;106(4):399-403.' },
  ],
  warnings: ['Ambos factores se usan en la práctica; confirmá cuál usa tu protocolo.'],
});

// ── Calcio corregido por albúmina ───────────────────────────────────────
interface CaIn { ca: number; alb: number }
export const calcioCorregidoCalc = ({ ca, alb }: CaIn) => ca + 0.8 * (4 - alb);
export const calcioCorregido = defineCalculator<CaIn, number>({
  id: 'calcio-corregido',
  name: 'Calcio corregido por albúmina',
  copyName: 'Ca corregido',
  category: 'laboratorio',
  keywords: ['calcio corregido', 'albumina', 'hipocalcemia', 'hipercalcemia', 'payne'],
  population: 'todos',
  inputs: [
    { kind: 'number', id: 'ca', label: 'Calcio total', copy: 'Ca {v}', unit: 'mg/dL', units: [{ id: 'mg/dL', label: 'mg/dL', factor: 1 }, { id: 'mmol/L', label: 'mmol/L', factor: 4.008 }], min: 3, max: 20 },
    { kind: 'number', id: 'alb', label: 'Albúmina', copy: 'alb {v}', unit: 'g/dL', units: ALB_UNITS, min: 0.5, max: 6 },
  ],
  compute: calcioCorregidoCalc,
  present: (v) => ({ value: fmt(v, 1), unit: 'mg/dL', precise: String(v) }),
  formula: 'Ca corregido (mg/dL) = Ca total + 0.8 × (4.0 − albúmina en g/dL)',
  references: [{ citation: 'Payne RB, et al. Interpretation of serum calcium in patients with abnormal serum proteins. Br Med J. 1973;4(5893):643-646.', doi: '10.1136/bmj.4.5893.643' }],
  warnings: ['No sustituye la medición de calcio iónico, sobre todo en pacientes críticos.', REF_NOTE],
});

// ── Osmolaridad sérica calculada ────────────────────────────────────────
interface OsmIn { na: number; glucosa: number; bun: number; medida?: number }
interface OsmOut { calculada: number; brecha?: number }
export const osmolaridadCalc = ({ na, glucosa, bun, medida }: OsmIn): OsmOut => {
  const calculada = 2 * na + glucosa / 18 + bun / 2.8;
  return { calculada, brecha: medida !== undefined ? medida - calculada : undefined };
};
export const osmolaridad = defineCalculator<OsmIn, OsmOut>({
  id: 'osmolaridad',
  name: 'Osmolaridad sérica calculada',
  copyName: 'Osmolaridad',
  category: 'laboratorio',
  keywords: ['osmolaridad', 'osmolalidad', 'brecha osmolar', 'osmolar gap', 'intoxicacion'],
  population: 'todos',
  inputs: [
    { kind: 'number', id: 'na', label: 'Sodio', copy: 'Na {v}', unit: 'mmol/L', min: 90, max: 190 },
    { kind: 'number', id: 'glucosa', label: 'Glucosa', copy: 'glucosa {v}', unit: 'mg/dL', units: GLU_UNITS, min: 20, max: 2000 },
    { kind: 'number', id: 'bun', label: 'Nitrógeno ureico (BUN)', copy: 'BUN {v}', unit: 'mg/dL', min: 1, max: 300 },
    { kind: 'number', id: 'medida', label: 'Osmolalidad medida (opcional, para la brecha)', copy: 'osm medida {v}', unit: 'mOsm/kg', min: 150, max: 600, optional: true },
  ],
  compute: osmolaridadCalc,
  present: (o) => ({ value: fmt(o.calculada, 1), unit: 'mOsm/kg', extra: o.brecha !== undefined ? [`Brecha osmolar: ${fmt(o.brecha, 1)} mOsm/kg`] : undefined }),
  formula: 'Osm calculada = 2 × Na + glucosa (mg/dL) / 18 + BUN (mg/dL) / 2.8\nBrecha osmolar = osm medida − osm calculada',
  references: [{ citation: 'Fórmula estándar. TODO(fuente): citar una referencia verificable.' }],
  warnings: [REF_NOTE, 'No incluye etanol ni otros osmoles.'],
});

// ── Conversión de unidades ──────────────────────────────────────────────
export interface Conversion { id: string; label: string; factor: number; decimals: number; from: string; to: string }
/** `destino = origen × factor`. */
export const CONVERSIONS: Conversion[] = [
  { id: 'glu-mgdl-mmol', label: 'Glucosa: mg/dL → mmol/L', factor: 1 / 18.016, decimals: 2, from: 'mg/dL', to: 'mmol/L' },
  { id: 'glu-mmol-mgdl', label: 'Glucosa: mmol/L → mg/dL', factor: 18.016, decimals: 0, from: 'mmol/L', to: 'mg/dL' },
  { id: 'cr-mgdl-umol', label: 'Creatinina: mg/dL → µmol/L', factor: 88.4, decimals: 0, from: 'mg/dL', to: 'µmol/L' },
  { id: 'cr-umol-mgdl', label: 'Creatinina: µmol/L → mg/dL', factor: 1 / 88.4, decimals: 2, from: 'µmol/L', to: 'mg/dL' },
  { id: 'col-mgdl-mmol', label: 'Colesterol: mg/dL → mmol/L', factor: 1 / 38.67, decimals: 2, from: 'mg/dL', to: 'mmol/L' },
  { id: 'col-mmol-mgdl', label: 'Colesterol: mmol/L → mg/dL', factor: 38.67, decimals: 0, from: 'mmol/L', to: 'mg/dL' },
  { id: 'bun-urea-mgdl', label: 'BUN → urea (mg/dL)', factor: 60 / 28, decimals: 1, from: 'mg/dL BUN', to: 'mg/dL urea' },
  { id: 'urea-bun-mgdl', label: 'Urea → BUN (mg/dL)', factor: 28 / 60, decimals: 1, from: 'mg/dL urea', to: 'mg/dL BUN' },
  { id: 'bun-urea-mmol', label: 'BUN (mg/dL) → urea (mmol/L)', factor: 1 / 2.8, decimals: 2, from: 'mg/dL BUN', to: 'mmol/L urea' },
  { id: 'urea-bun-mmol', label: 'Urea (mmol/L) → BUN (mg/dL)', factor: 2.8, decimals: 1, from: 'mmol/L urea', to: 'mg/dL BUN' },
];
interface ConvIn { conversion: string; valor: number }
interface ConvOut { resultado: number; conv: Conversion }
export const convertir = ({ conversion, valor }: ConvIn): ConvOut => {
  const conv = CONVERSIONS.find((c) => c.id === conversion)!;
  return { resultado: valor * conv.factor, conv };
};
export const conversionUnidades = defineCalculator<ConvIn, ConvOut>({
  id: 'conversion-unidades',
  name: 'Conversión de unidades de laboratorio',
  copyName: 'Conversión',
  category: 'laboratorio',
  keywords: ['conversion', 'unidades', 'glucosa', 'creatinina', 'colesterol', 'urea', 'bun', 'mmol/l', 'mg/dl'],
  population: 'todos',
  inputs: [
    { kind: 'choice', id: 'conversion', label: 'Conversión', default: CONVERSIONS[0]!.id, options: CONVERSIONS.map((c) => ({ value: c.id, label: c.label, copy: c.label })) },
    { kind: 'number', id: 'valor', label: 'Valor', copy: '{v}', min: 0, max: 100000 },
  ],
  compute: convertir,
  present: (o) => ({ value: fmt(o.resultado, o.conv.decimals), unit: o.conv.to, precise: String(o.resultado) }),
  formula: 'Glucosa: 1 mmol/L = 18.016 mg/dL · Creatinina: 1 mg/dL = 88.4 µmol/L · Colesterol: 1 mmol/L = 38.67 mg/dL\nUrea (mg/dL) = BUN × 60/28 · Urea (mmol/L) = BUN (mg/dL) / 2.8',
  references: [{ citation: 'Factores de conversión estándar (SI). TODO(fuente): citar una tabla de referencia verificable.' }],
  warnings: ['El colesterol aplica a total, LDL y HDL; los triglicéridos usan otro factor (no incluido).'],
});
