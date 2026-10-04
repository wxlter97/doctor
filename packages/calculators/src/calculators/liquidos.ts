import { defineCalculator, fmt } from '../helpers';
import type { NumberInput } from '../types';
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

// ── Parkland (quemados) ─────────────────────────────────────────────────
interface ParklandIn { peso: number; sct: number }
interface ParklandOut { totalMl: number; primeras8Ml: number; mlHora8: number; siguientes16Ml: number; mlHora16: number }
export function parkland({ peso, sct }: ParklandIn): ParklandOut {
  const totalMl = 4 * peso * sct;
  return { totalMl, primeras8Ml: totalMl / 2, mlHora8: totalMl / 2 / 8, siguientes16Ml: totalMl / 2, mlHora16: totalMl / 2 / 16 };
}

export const parklandCalc = defineCalculator<ParklandIn, ParklandOut>({
  id: 'parkland',
  name: 'Parkland (reanimación del gran quemado)',
  copyName: 'Parkland',
  category: 'liquidos',
  keywords: ['parkland', 'quemados', 'quemaduras', 'baxter', 'reanimacion', 'lactato de ringer', 'sct'],
  population: 'todos',
  inputs: [
    { kind: 'number', id: 'peso', label: 'Peso', copy: 'peso {v}', unit: 'kg', units: WEIGHT_UNITS, min: 3, max: 300 },
    { kind: 'number', id: 'sct', label: 'Superficie corporal quemada (quemaduras de 2.º y 3.er grado)', copy: 'SCQ {v}', unit: '%', min: 1, max: 100 },
  ],
  compute: parkland,
  present: (o) => ({
    value: fmt(o.totalMl),
    unit: 'mL en 24 h',
    extra: [`Primeras 8 h: ${fmt(o.primeras8Ml)} mL (${fmt(o.mlHora8, 1)} mL/h)`, `Siguientes 16 h: ${fmt(o.siguientes16Ml)} mL (${fmt(o.mlHora16, 1)} mL/h)`],
    precise: `${o.totalMl} mL`,
  }),
  formula: 'Total 24 h (mL) = 4 mL × peso (kg) × % de superficie corporal quemada\nMitad en las primeras 8 h (contadas desde la hora de la quemadura) y mitad en las 16 h siguientes.',
  references: [
    { citation: 'Baxter CR, Shires T. Physiological response to crystalloid resuscitation of severe burns. Ann N Y Acad Sci. 1968;150(3):874-894.' },
  ],
  warnings: [
    'Es una estimación inicial con solución cristaloide: ajustá según la diuresis y la respuesta clínica.',
    'Si ya pasó tiempo desde la quemadura, las primeras 8 h se cuentan desde ese momento, no desde la llegada.',
    'En niños se suma el líquido de mantenimiento; verificá el protocolo.',
  ],
});

// ── Balance hídrico ─────────────────────────────────────────────────────
interface BalanceIn { oral: number; parenteral: number; otrosIngresos: number; diuresis: number; drenajes: number; otrosEgresos: number; insensibles?: number; horas?: number; peso?: number }
interface BalanceOut { ingresos: number; egresos: number; balance: number; diuresisMlKgH?: number }

export function balanceHidrico(i: BalanceIn): BalanceOut {
  const ingresos = i.oral + i.parenteral + i.otrosIngresos;
  const egresos = i.diuresis + i.drenajes + i.otrosEgresos + (i.insensibles ?? 0);
  return { ingresos, egresos, balance: ingresos - egresos, diuresisMlKgH: i.horas && i.peso ? i.diuresis / i.peso / i.horas : undefined };
}

const ml = (id: string, label: string, optional = false): NumberInput => ({ kind: 'number', id, label, copy: `${label.toLowerCase()} {v}`, unit: 'mL', min: 0, max: 50000, optional });

export const balance = defineCalculator<BalanceIn, BalanceOut>({
  id: 'balance-hidrico',
  name: 'Balance hídrico',
  copyName: 'Balance hídrico',
  category: 'liquidos',
  keywords: ['balance hidrico', 'ingresos', 'egresos', 'diuresis', 'perdidas insensibles', 'ml/kg/h'],
  population: 'todos',
  inputs: [
    ml('oral', 'Ingreso oral'), ml('parenteral', 'Ingreso parenteral'), ml('otrosIngresos', 'Otros ingresos'),
    ml('diuresis', 'Diuresis'), ml('drenajes', 'Drenajes'), ml('otrosEgresos', 'Vómitos, deposiciones y otros egresos'),
    { ...ml('insensibles', 'Pérdidas insensibles (opcional)', true), help: 'Ingresá tu estimación; la app no asume un valor.' },
    { kind: 'number', id: 'horas', label: 'Horas del período (opcional)', copy: 'período {v}', unit: 'h', min: 0.5, max: 72, optional: true },
    { kind: 'number', id: 'peso', label: 'Peso (opcional)', copy: 'peso {v}', unit: 'kg', units: WEIGHT_UNITS, min: 0.3, max: 400, optional: true },
  ],
  compute: balanceHidrico,
  interpret: (o) => (o.balance > 0 ? { label: 'Balance positivo', severity: 'info' } : o.balance < 0 ? { label: 'Balance negativo', severity: 'info' } : { label: 'Balance neutro', severity: 'info' }),
  present: (o) => ({
    value: `${o.balance > 0 ? '+' : ''}${fmt(o.balance)}`,
    unit: 'mL',
    extra: [`Ingresos: ${fmt(o.ingresos)} mL · Egresos: ${fmt(o.egresos)} mL`, ...(o.diuresisMlKgH !== undefined ? [`Diuresis: ${fmt(o.diuresisMlKgH, 2)} mL/kg/h`] : [])],
  }),
  formula: 'Balance = ingresos − egresos (mL)\nDiuresis (mL/kg/h) = diuresis / peso / horas del período',
  references: [{ citation: 'Cálculo aritmético; no requiere referencia bibliográfica.' }],
  warnings: ['El balance depende de que los registros estén completos y del período elegido.'],
});
