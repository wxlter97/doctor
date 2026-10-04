import { defineCalculator, fmt } from '../helpers';
import { scoreInput } from './escalas';
import type { UnitDef } from '../types';

const BILI_UNITS: UnitDef[] = [{ id: 'mg/dL', label: 'mg/dL', factor: 1 }, { id: 'µmol/L', label: 'µmol/L', factor: 1 / 17.1 }];

// ── Child-Pugh ──────────────────────────────────────────────────────────
interface CpIn { bili: number; alb: number; inr: number; ascitis: number; enc: number }
export const cpPoints = {
  bili: (v: number) => (v < 2 ? 1 : v <= 3 ? 2 : 3),
  alb: (v: number) => (v > 3.5 ? 1 : v >= 2.8 ? 2 : 3),
  inr: (v: number) => (v < 1.7 ? 1 : v <= 2.3 ? 2 : 3),
};
export const childPughTotal = (i: CpIn) => cpPoints.bili(i.bili) + cpPoints.alb(i.alb) + cpPoints.inr(i.inr) + i.ascitis + i.enc;
export const childPughClass = (t: number) => (t <= 6 ? 'A' : t <= 9 ? 'B' : 'C');

export const childPugh = defineCalculator<CpIn, number>({
  id: 'child-pugh',
  name: 'Child-Pugh (cirrosis)',
  copyName: 'Child-Pugh',
  category: 'hepatico',
  keywords: ['child-pugh', 'child pugh', 'cirrosis', 'hepatico', 'pronostico', 'ascitis', 'encefalopatia'],
  population: 'adulto',
  inputs: [
    { kind: 'number', id: 'bili', label: 'Bilirrubina total', copy: 'bili {v}', unit: 'mg/dL', units: BILI_UNITS, min: 0.1, max: 60 },
    { kind: 'number', id: 'alb', label: 'Albúmina', copy: 'alb {v}', unit: 'g/dL', units: [{ id: 'g/dL', label: 'g/dL', factor: 1 }, { id: 'g/L', label: 'g/L', factor: 0.1 }], min: 1, max: 6 },
    { kind: 'number', id: 'inr', label: 'INR', copy: 'INR {v}', min: 0.5, max: 10 },
    scoreInput('ascitis', 'Ascitis', 'asc{v}', [[1, 'Ausente'], [2, 'Leve o controlada con diuréticos'], [3, 'Moderada a severa o refractaria']]),
    scoreInput('enc', 'Encefalopatía hepática', 'enc{v}', [[1, 'Ninguna'], [2, 'Grado 1–2 o controlada con medicación'], [3, 'Grado 3–4 o refractaria']]),
  ],
  compute: childPughTotal,
  interpret: (t) => ({
    label: `Clase ${childPughClass(t)} (${t <= 6 ? '5–6' : t <= 9 ? '7–9' : '10–15'})`,
    severity: t <= 6 ? 'info' : t <= 9 ? 'warning' : 'danger',
  }),
  present: (t) => ({ value: fmt(t), unit: `puntos · clase ${childPughClass(t)}` }),
  formula:
    'Bilirrubina (mg/dL): < 2 → 1 · 2–3 → 2 · > 3 → 3\nAlbúmina (g/dL): > 3.5 → 1 · 2.8–3.5 → 2 · < 2.8 → 3\nINR: < 1.7 → 1 · 1.7–2.3 → 2 · > 2.3 → 3\nAscitis y encefalopatía: 1–3 según gravedad.\nClase A 5–6 · B 7–9 · C 10–15.',
  references: [
    { citation: 'Pugh RNH, et al. Transection of the oesophagus for bleeding oesophageal varices. Br J Surg. 1973;60(8):646-649.', doi: '10.1002/bjs.1800600817' },
  ],
  warnings: ['Ascitis y encefalopatía son valoraciones clínicas subjetivas. Verificá los puntos de corte con la fuente (pendiente).'],
});

// ── MELD-Na ─────────────────────────────────────────────────────────────
interface MeldIn { cr: number; bili: number; inr: number; na: number; dialisis: number }
export interface MeldOut { meld: number; meldNa: number }

/** MELD (UNOS) y MELD-Na. Valores < 1 se fijan en 1; Cr máx. 4.0 (o 4.0 si hay diálisis); Na acotado a 125–137. */
export function meldNa({ cr, bili, inr, na, dialisis }: MeldIn): MeldOut {
  const c = dialisis ? 4 : Math.min(Math.max(cr, 1), 4);
  const b = Math.max(bili, 1);
  const i = Math.max(inr, 1);
  const meld = Math.round((0.957 * Math.log(c) + 0.378 * Math.log(b) + 1.12 * Math.log(i) + 0.643) * 10);
  const s = Math.min(Math.max(na, 125), 137);
  const meldNaRaw = meld > 11 ? meld + 1.32 * (137 - s) - 0.033 * meld * (137 - s) : meld;
  return { meld, meldNa: Math.round(meldNaRaw) };
}

export const meld = defineCalculator<MeldIn, MeldOut>({
  id: 'meld-na',
  name: 'MELD-Na',
  copyName: 'MELD-Na',
  category: 'hepatico',
  keywords: ['meld', 'meld-na', 'trasplante hepatico', 'cirrosis', 'sodio', 'bilirrubina'],
  population: 'adulto',
  inputs: [
    { kind: 'number', id: 'cr', label: 'Creatinina', copy: 'Cr {v}', unit: 'mg/dL', units: [{ id: 'mg/dL', label: 'mg/dL', factor: 1 }, { id: 'µmol/L', label: 'µmol/L', factor: 1 / 88.4 }], min: 0.1, max: 20 },
    { kind: 'number', id: 'bili', label: 'Bilirrubina total', copy: 'bili {v}', unit: 'mg/dL', units: BILI_UNITS, min: 0.1, max: 60 },
    { kind: 'number', id: 'inr', label: 'INR', copy: 'INR {v}', min: 0.5, max: 10 },
    { kind: 'number', id: 'na', label: 'Sodio sérico', copy: 'Na {v}', unit: 'mmol/L', min: 100, max: 170, integer: true },
    {
      kind: 'choice', id: 'dialisis', label: 'Diálisis ≥ 2 veces en la última semana', default: 0, copy: 'diálisis', omitIfZero: true,
      options: [{ value: 0, label: 'No', copy: '' }, { value: 1, label: 'Sí', copy: 'diálisis' }],
    },
  ],
  compute: meldNa,
  interpret: (o) => ({ label: `MELD ${o.meld} · MELD-Na ${o.meldNa}`, severity: 'info' }),
  present: (o) => ({ value: fmt(o.meldNa), unit: 'MELD-Na', extra: [`MELD: ${o.meld}`] }),
  formula:
    'MELD = 10 × (0.957·ln(Cr) + 0.378·ln(bili) + 1.120·ln(INR) + 0.643)\nValores < 1 se toman como 1; Cr máx. 4.0 (y 4.0 si hay diálisis).\nSi MELD > 11: MELD-Na = MELD + 1.32·(137 − Na) − 0.033·MELD·(137 − Na), con Na entre 125 y 137.',
  references: [
    { citation: 'Kim WR, et al. Hyponatremia and mortality among patients on the liver-transplant waiting list. N Engl J Med. 2008;359(10):1018-1026.', doi: '10.1056/NEJMoa0801209' },
  ],
  warnings: [
    'Es la versión MELD-Na; existe MELD 3.0, que añade sexo y albúmina y se usa en la asignación actual de algunos programas.',
  ],
});
