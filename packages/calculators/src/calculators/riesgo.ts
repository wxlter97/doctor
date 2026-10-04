import { defineCalculator, fmt } from '../helpers';
import type { Interpretation } from '../types';
import { scoreInput, yesNo } from './escalas';

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
const WARN_CLINICAL = 'Herramienta de apoyo: la decisión clínica final es del médico tratante.';

// ── HAS-BLED ────────────────────────────────────────────────────────────
type HasBledIn = Record<'hta' | 'renal' | 'hepatica' | 'acv' | 'sangrado' | 'inr' | 'edad' | 'drogas' | 'alcohol', number>;
export const hasBledInterpret = (t: number): Interpretation =>
  t >= 3 ? { label: 'Riesgo alto de sangrado (≥ 3)', severity: 'danger' }
    : t === 2 ? { label: 'Riesgo moderado (2)', severity: 'warning' }
      : { label: 'Riesgo bajo (0–1)', severity: 'info' };

export const hasBled = defineCalculator<HasBledIn, number>({
  id: 'has-bled',
  name: 'HAS-BLED',
  copyName: 'HAS-BLED',
  category: 'cardio',
  keywords: ['has-bled', 'sangrado', 'anticoagulacion', 'fibrilacion auricular', 'hemorragia'],
  population: 'adulto',
  inputs: [
    yesNo('hta', 'Hipertensión no controlada (PAS > 160 mmHg)', 'HTA', 1),
    yesNo('renal', 'Función renal anormal (diálisis, trasplante o creatinina > 2.26 mg/dL)', 'renal', 1),
    yesNo('hepatica', 'Función hepática anormal (cirrosis o bilirrubina > 2× y AST/ALT/FA > 3× lo normal)', 'hepática', 1),
    yesNo('acv', 'ACV previo', 'ACV', 1),
    yesNo('sangrado', 'Antecedente de sangrado o predisposición (anemia, trombocitopenia)', 'sangrado', 1),
    yesNo('inr', 'INR lábil (poco tiempo en rango terapéutico)', 'INR lábil', 1),
    yesNo('edad', 'Edad > 65 años', '>65 a', 1),
    yesNo('drogas', 'Fármacos que predisponen (antiagregantes, AINE)', 'fármacos', 1),
    yesNo('alcohol', 'Alcohol (≥ 8 bebidas por semana)', 'alcohol', 1),
  ],
  compute: sum,
  interpret: hasBledInterpret,
  present: (t) => ({ value: fmt(t), unit: '/ 9' }),
  formula: 'Un punto por cada criterio: H, A (renal y hepática, 1 cada una), S, B, L, E, D (fármacos y alcohol, 1 cada uno). Rango 0–9.',
  references: [
    { citation: 'Pisters R, et al. A novel user-friendly score (HAS-BLED) to assess 1-year risk of major bleeding in patients with atrial fibrillation. Chest. 2010;138(5):1093-1100.', doi: '10.1378/chest.10-0134' },
  ],
  warnings: ['Un puntaje alto señala factores de riesgo a corregir; no es por sí solo una razón para no anticoagular.', WARN_CLINICAL],
});

// ── CURB-65 ─────────────────────────────────────────────────────────────
type CurbIn = Record<'confusion' | 'urea' | 'fr' | 'pa' | 'edad', number>;
export const curbInterpret = (t: number): Interpretation =>
  t >= 3 ? { label: 'Riesgo alto (3–5): considerar manejo hospitalario urgente', severity: 'danger' }
    : t === 2 ? { label: 'Riesgo intermedio (2): considerar hospitalización', severity: 'warning' }
      : { label: 'Riesgo bajo (0–1): considerar manejo ambulatorio', severity: 'info' };

export const curb65 = defineCalculator<CurbIn, number>({
  id: 'curb-65',
  name: 'CURB-65 (neumonía adquirida en la comunidad)',
  copyName: 'CURB-65',
  category: 'respiratorio',
  keywords: ['curb-65', 'neumonia', 'pac', 'gravedad', 'hospitalizar'],
  population: 'adulto',
  inputs: [
    yesNo('confusion', 'Confusión de inicio reciente', 'confusión', 1),
    yesNo('urea', 'Urea > 7 mmol/L (BUN > 19 mg/dL)', 'urea alta', 1),
    yesNo('fr', 'Frecuencia respiratoria ≥ 30/min', 'FR ≥ 30', 1),
    yesNo('pa', 'PA sistólica < 90 o diastólica ≤ 60 mmHg', 'PA baja', 1),
    yesNo('edad', 'Edad ≥ 65 años', '≥ 65 a', 1),
  ],
  compute: sum,
  interpret: curbInterpret,
  present: (t) => ({ value: fmt(t), unit: '/ 5' }),
  formula: 'Un punto por cada criterio: Confusión, Urea, Respiratoria (FR), Blood pressure, edad ≥ 65. Rango 0–5.',
  references: [
    { citation: 'Lim WS, et al. Defining community acquired pneumonia severity on presentation to hospital: an international derivation and validation study. Thorax. 2003;58(5):377-382.', doi: '10.1136/thorax.58.5.377' },
  ],
  warnings: ['No contempla comorbilidades, hipoxemia ni contexto social: complementá con el criterio clínico.', WARN_CLINICAL],
});

// ── Wells TVP ───────────────────────────────────────────────────────────
type WellsDvtIn = Record<'cancer' | 'paralisis' | 'cama' | 'dolor' | 'pierna' | 'pantorrilla' | 'edema' | 'colaterales' | 'previa' | 'alternativo', number>;
export const wellsDvtInterpret = (t: number): Interpretation =>
  t >= 3 ? { label: 'Probabilidad alta (≥ 3)', severity: 'danger' }
    : t >= 1 ? { label: 'Probabilidad moderada (1–2)', severity: 'warning' }
      : { label: 'Probabilidad baja (≤ 0)', severity: 'info' };

export const wellsDvt = defineCalculator<WellsDvtIn, number>({
  id: 'wells-tvp',
  name: 'Wells para trombosis venosa profunda (TVP)',
  copyName: 'Wells TVP',
  category: 'cardio',
  keywords: ['wells', 'tvp', 'trombosis venosa profunda', 'dimero d', 'pierna'],
  population: 'adulto',
  inputs: [
    yesNo('cancer', 'Cáncer activo (tratamiento en los últimos 6 meses o paliativo)', 'cáncer', 1),
    yesNo('paralisis', 'Parálisis, paresia o inmovilización con yeso de una pierna', 'parálisis/yeso', 1),
    yesNo('cama', 'Encamado ≥ 3 días o cirugía mayor en las últimas 12 semanas', 'encamado/cirugía', 1),
    yesNo('dolor', 'Dolor localizado a lo largo del sistema venoso profundo', 'dolor venoso', 1),
    yesNo('pierna', 'Toda la pierna inflamada', 'pierna inflamada', 1),
    yesNo('pantorrilla', 'Pantorrilla inflamada ≥ 3 cm más que la otra (10 cm bajo la tuberosidad tibial)', 'pantorrilla ≥ 3 cm', 1),
    yesNo('edema', 'Edema con fóvea limitado a la pierna sintomática', 'edema con fóvea', 1),
    yesNo('colaterales', 'Venas superficiales colaterales (no varicosas)', 'colaterales', 1),
    yesNo('previa', 'TVP previa documentada', 'TVP previa', 1),
    yesNo('alternativo', 'Diagnóstico alternativo al menos tan probable como la TVP', 'dx alternativo', -2),
  ],
  compute: sum,
  interpret: wellsDvtInterpret,
  present: (t) => ({ value: fmt(t), unit: 'puntos' }),
  formula: 'Suma de criterios (+1 cada uno; −2 si hay un diagnóstico alternativo igual o más probable). Rango −2 a 9.',
  references: [
    { citation: 'Wells PS, et al. Value of assessment of pretest probability of deep-vein thrombosis in clinical management. Lancet. 1997;350(9094):1795-1798.', doi: '10.1016/S0140-6736(97)08140-3' },
    { citation: 'Wells PS, et al. Evaluation of D-dimer in the diagnosis of suspected deep-vein thrombosis (versión modificada, incluye "TVP previa"). N Engl J Med. 2003;349(13):1227-1235.', doi: '10.1056/NEJMoa023153' },
  ],
  warnings: ['La probabilidad pretest orienta la estrategia diagnóstica (dímero D, ecografía); no confirma ni descarta por sí sola.', WARN_CLINICAL],
});

// ── Wells TEP ───────────────────────────────────────────────────────────
type WellsPeIn = Record<'tvp' | 'probable' | 'fc' | 'inmov' | 'previo' | 'hemoptisis' | 'cancer', number>;
export const wellsPeInterpret = (t: number): Interpretation =>
  t > 6 ? { label: 'Probabilidad alta (> 6)', severity: 'danger' }
    : t >= 2 ? { label: `Probabilidad moderada (2–6) · ${t > 4 ? 'TEP probable (> 4)' : 'TEP improbable (≤ 4)'}`, severity: 'warning' }
      : { label: 'Probabilidad baja (< 2) · TEP improbable (≤ 4)', severity: 'info' };

export const wellsPe = defineCalculator<WellsPeIn, number>({
  id: 'wells-tep',
  name: 'Wells para tromboembolia pulmonar (TEP)',
  copyName: 'Wells TEP',
  category: 'respiratorio',
  keywords: ['wells', 'tep', 'embolia pulmonar', 'tromboembolia', 'dimero d'],
  population: 'adulto',
  inputs: [
    yesNo('tvp', 'Signos clínicos de TVP (inflamación de la pierna y dolor a la palpación)', 'signos TVP', 3),
    yesNo('probable', 'TEP es el diagnóstico más probable o alternativas menos probables', 'TEP más probable', 3),
    yesNo('fc', 'Frecuencia cardíaca > 100 lpm', 'FC > 100', 1.5),
    yesNo('inmov', 'Inmovilización ≥ 3 días o cirugía en las últimas 4 semanas', 'inmov./cirugía', 1.5),
    yesNo('previo', 'TEP o TVP previos', 'TEP/TVP previo', 1.5),
    yesNo('hemoptisis', 'Hemoptisis', 'hemoptisis', 1),
    yesNo('cancer', 'Cáncer (en tratamiento, tratado en los últimos 6 meses o paliativo)', 'cáncer', 1),
  ],
  compute: sum,
  interpret: wellsPeInterpret,
  present: (t) => ({ value: fmt(t, 1), unit: 'puntos' }),
  formula: 'Suma de criterios (3 · 3 · 1.5 · 1.5 · 1.5 · 1 · 1). Rango 0–12.5. Tres niveles: < 2 baja, 2–6 moderada, > 6 alta. Dicotómica: ≤ 4 improbable, > 4 probable.',
  references: [
    { citation: 'Wells PS, et al. Derivation of a simple clinical model to categorize patients probability of pulmonary embolism: increasing the models utility with the SimpliRED D-dimer. Thromb Haemost. 2000;83(3):416-420.', doi: '10.1055/s-0037-1613830' },
  ],
  warnings: ['Orienta la estrategia diagnóstica (dímero D, angiotomografía); no confirma ni descarta por sí sola.', WARN_CLINICAL],
});

// ── qSOFA y SOFA ────────────────────────────────────────────────────────
type QsofaIn = Record<'mentacion' | 'fr' | 'pas', number>;
export const qsofa = defineCalculator<QsofaIn, number>({
  id: 'qsofa',
  name: 'qSOFA',
  copyName: 'qSOFA',
  category: 'infeccioso',
  keywords: ['qsofa', 'sepsis', 'infeccion', 'tamizaje', 'sofa rapido'],
  population: 'adulto',
  inputs: [
    yesNo('mentacion', 'Alteración del estado mental (Glasgow < 15)', 'mentación alterada', 1),
    yesNo('fr', 'Frecuencia respiratoria ≥ 22/min', 'FR ≥ 22', 1),
    yesNo('pas', 'PA sistólica ≤ 100 mmHg', 'PAS ≤ 100', 1),
  ],
  compute: sum,
  interpret: (t) => (t >= 2 ? { label: 'Positivo (≥ 2): mayor riesgo de mala evolución; evaluá disfunción orgánica', severity: 'danger' } : { label: 'Negativo (< 2): no descarta sepsis', severity: 'info' }),
  present: (t) => ({ value: fmt(t), unit: '/ 3' }),
  formula: 'Un punto por cada criterio: estado mental alterado, FR ≥ 22, PAS ≤ 100. Rango 0–3.',
  references: [
    { citation: 'Seymour CW, et al. Assessment of clinical criteria for sepsis (Sepsis-3). JAMA. 2016;315(8):762-774.', doi: '10.1001/jama.2016.0288' },
  ],
  warnings: ['Es una herramienta de tamizaje, no un diagnóstico de sepsis.', WARN_CLINICAL],
});

type SofaIn = Record<'resp' | 'coag' | 'higado' | 'cardio' | 'snc' | 'renal', number>;
export const sofa = defineCalculator<SofaIn, number>({
  id: 'sofa',
  name: 'SOFA',
  copyName: 'SOFA',
  category: 'infeccioso',
  keywords: ['sofa', 'sepsis', 'disfuncion organica', 'uci', 'cuidados intensivos'],
  population: 'adulto',
  inputs: [
    scoreInput('resp', 'Respiración: PaO₂/FiO₂ (mmHg)', 'resp{v}', [
      [0, '≥ 400'], [1, '< 400'], [2, '< 300'], [3, '< 200 con soporte ventilatorio'], [4, '< 100 con soporte ventilatorio'],
    ]),
    scoreInput('coag', 'Coagulación: plaquetas (×10³/µL)', 'coag{v}', [[0, '≥ 150'], [1, '< 150'], [2, '< 100'], [3, '< 50'], [4, '< 20']]),
    scoreInput('higado', 'Hígado: bilirrubina (mg/dL)', 'hígado{v}', [[0, '< 1.2'], [1, '1.2–1.9'], [2, '2.0–5.9'], [3, '6.0–11.9'], [4, '≥ 12.0']]),
    scoreInput('cardio', 'Cardiovascular', 'CV{v}', [
      [0, 'PAM ≥ 70 mmHg'], [1, 'PAM < 70 mmHg'], [2, 'Dopamina ≤ 5 o dobutamina (cualquier dosis)'],
      [3, 'Dopamina > 5, adrenalina ≤ 0.1 o noradrenalina ≤ 0.1 µg/kg/min'], [4, 'Dopamina > 15, adrenalina > 0.1 o noradrenalina > 0.1 µg/kg/min'],
    ]),
    scoreInput('snc', 'Sistema nervioso: Glasgow', 'SNC{v}', [[0, '15'], [1, '13–14'], [2, '10–12'], [3, '6–9'], [4, '< 6']]),
    scoreInput('renal', 'Riñón: creatinina (mg/dL) o diuresis', 'renal{v}', [
      [0, '< 1.2'], [1, '1.2–1.9'], [2, '2.0–3.4'], [3, '3.5–4.9 o diuresis < 500 mL/día'], [4, '≥ 5.0 o diuresis < 200 mL/día'],
    ]),
  ],
  compute: sum,
  interpret: (t) => (t >= 2 ? { label: 'SOFA ≥ 2: disfunción orgánica si el cambio desde el basal es ≥ 2', severity: 'warning' } : { label: 'SOFA < 2', severity: 'info' }),
  present: (t) => ({ value: fmt(t), unit: '/ 24' }),
  formula: 'Suma de seis sistemas (respiratorio, coagulación, hepático, cardiovascular, neurológico, renal), 0–4 cada uno. Rango 0–24.',
  references: [
    { citation: 'Vincent JL, et al. The SOFA (Sepsis-related Organ Failure Assessment) score to describe organ dysfunction/failure. Intensive Care Med. 1996;22(7):707-710.', doi: '10.1007/BF01709751' },
    { citation: 'Singer M, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):801-810.', doi: '10.1001/jama.2016.0287' },
  ],
  warnings: ['Usá los peores valores de las últimas 24 h. El cambio respecto al basal es lo que define disfunción orgánica.', WARN_CLINICAL],
});
