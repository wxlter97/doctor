import { defineCalculator, fmt } from '../helpers';
import type { ChoiceInput, Interpretation } from '../types';

export const tile = (value: number, label: string) => ({ value, label: `${value} · ${label}` });
export const scoreInput = (id: string, label: string, copy: string, options: [number, string][]): ChoiceInput => ({
  kind: 'choice', id, label, copy, scored: true,
  options: options.map(([v, l]) => tile(v, l)),
});

// ── Glasgow ─────────────────────────────────────────────────────────────
interface GcsIn { ocular: number; verbal: number; motora: number }
const gcsSum = ({ ocular, verbal, motora }: GcsIn) => ocular + verbal + motora;
export function gcsInterpret(total: number): Interpretation {
  if (total >= 13) return { label: 'Traumatismo leve (13–15)', severity: 'info' };
  if (total >= 9) return { label: 'Moderado (9–12)', severity: 'warning' };
  return { label: 'Grave (3–8)', severity: 'danger' };
}

const ocular = scoreInput('ocular', 'Apertura ocular', 'O{v}', [
  [4, 'Espontánea'], [3, 'Al hablarle'], [2, 'Al dolor'], [1, 'Ninguna'],
]);
const motora = scoreInput('motora', 'Respuesta motora', 'M{v}', [
  [6, 'Obedece órdenes'], [5, 'Localiza el dolor'], [4, 'Retira al dolor'],
  [3, 'Flexión anormal (decorticación)'], [2, 'Extensión anormal (descerebración)'], [1, 'Ninguna'],
]);

const gcsCommon = {
  category: 'neuro' as const,
  compute: gcsSum,
  interpret: gcsInterpret,
  present: (t: number) => ({ value: fmt(t), unit: '/ 15' }),
  formula: 'Total = apertura ocular (1–4) + respuesta verbal (1–5) + respuesta motora (1–6). Rango 3–15.',
};

export const glasgow = defineCalculator<GcsIn, number>({
  ...gcsCommon,
  id: 'glasgow',
  name: 'Escala de Glasgow (adulto)',
  copyName: 'Glasgow',
  keywords: ['glasgow', 'gcs', 'coma', 'conciencia', 'neurologico', 'trauma'],
  population: 'adulto',
  inputs: [
    ocular,
    scoreInput('verbal', 'Respuesta verbal', 'V{v}', [
      [5, 'Orientada'], [4, 'Confusa'], [3, 'Palabras inapropiadas'], [2, 'Sonidos incomprensibles'], [1, 'Ninguna'],
    ]),
    motora,
  ],
  references: [
    { citation: 'Teasdale G, Jennett B. Assessment of coma and impaired consciousness: a practical scale. Lancet. 1974;2(7872):81-84.', doi: '10.1016/S0140-6736(74)91639-0' },
  ],
  warnings: ['Evaluá con el mejor estado alcanzado tras estabilizar. Sedación, intubación o edema palpebral limitan la escala.'],
});

export const glasgowPediatrico = defineCalculator<GcsIn, number>({
  ...gcsCommon,
  id: 'glasgow-pediatrico',
  name: 'Escala de Glasgow (pediátrica, preverbal)',
  copyName: 'Glasgow pediátrico',
  keywords: ['glasgow', 'gcs', 'pediatrico', 'lactante', 'coma', 'conciencia', 'niño'],
  population: 'pediatrico',
  inputs: [
    ocular,
    scoreInput('verbal', 'Respuesta verbal', 'V{v}', [
      [5, 'Balbucea, sonríe, llora normal'], [4, 'Llora, se consuela'], [3, 'Irritable persistente'],
      [2, 'Inquieto, agitado'], [1, 'Ninguna'],
    ]),
    scoreInput('motora', 'Respuesta motora', 'M{v}', [
      [6, 'Movimiento espontáneo normal'], [5, 'Retira al tacto'], [4, 'Retira al dolor'],
      [3, 'Flexión anormal'], [2, 'Extensión anormal'], [1, 'Ninguna'],
    ]),
  ],
  references: [
    { citation: 'Adaptación pediátrica de la escala de Teasdale G, Jennett B. Lancet. 1974;2(7872):81-84. TODO(fuente): citar la publicación de la adaptación pediátrica y verificar los descriptores.' },
  ],
  warnings: ['Descriptores verbales y motores para niños que aún no hablan. Verificar contra la fuente (pendiente).'],
});

// ── APGAR ───────────────────────────────────────────────────────────────
interface ApgarIn { fc: number; resp: number; tono: number; reflejos: number; color: number }
export const apgar = defineCalculator<ApgarIn, number>({
  id: 'apgar',
  name: 'Puntuación de APGAR',
  copyName: 'APGAR',
  category: 'neonatal',
  keywords: ['apgar', 'recien nacido', 'neonato', 'parto', 'vitalidad'],
  population: 'neonatal',
  inputs: [
    scoreInput('fc', 'Frecuencia cardíaca', 'FC{v}', [[2, '≥ 100 lpm'], [1, '< 100 lpm'], [0, 'Ausente']]),
    scoreInput('resp', 'Esfuerzo respiratorio', 'R{v}', [[2, 'Llanto fuerte'], [1, 'Lento o irregular'], [0, 'Ausente']]),
    scoreInput('tono', 'Tono muscular', 'T{v}', [[2, 'Movimiento activo'], [1, 'Flexión leve de extremidades'], [0, 'Flácido']]),
    scoreInput('reflejos', 'Irritabilidad refleja', 'I{v}', [[2, 'Llanto o tos'], [1, 'Mueca'], [0, 'Sin respuesta']]),
    scoreInput('color', 'Color', 'C{v}', [[2, 'Todo rosado'], [1, 'Cuerpo rosado, extremidades azules'], [0, 'Azul o pálido']]),
  ],
  compute: ({ fc, resp, tono, reflejos, color }) => fc + resp + tono + reflejos + color,
  interpret: (t) =>
    t >= 7 ? { label: 'Normal (7–10)', severity: 'info' }
      : t >= 4 ? { label: 'Moderadamente deprimido (4–6)', severity: 'warning' }
        : { label: 'Gravemente deprimido (0–3)', severity: 'danger' },
  present: (t) => ({ value: fmt(t), unit: '/ 10' }),
  formula: 'Total = FC + esfuerzo respiratorio + tono + irritabilidad refleja + color (0–2 cada uno). Rango 0–10.',
  references: [{ citation: 'Apgar V. A proposal for a new method of evaluation of the newborn infant. Curr Res Anesth Analg. 1953;32(4):260-267.' }],
  warnings: ['Se registra al minuto 1 y al minuto 5. No reemplaza la decisión de reanimar, que no espera al puntaje.'],
});

// ── CHA₂DS₂-VASc ────────────────────────────────────────────────────────
interface ChadsIn { ic: number; hta: number; edad: number; dm: number; acv: number; vascular: number; sexo: number }
export const yesNo = (id: string, label: string, copy: string, points: number): ChoiceInput => ({
  kind: 'choice', id, label, copy, scored: true, omitIfZero: true, default: 0,
  options: [{ value: 0, label: '0 · No', copy: '' }, { value: points, label: `${points > 0 ? "+" : ""}${points} · Sí`, copy }],
});

export const cha2ds2vasc = defineCalculator<ChadsIn, number>({
  id: 'cha2ds2-vasc',
  name: 'CHA₂DS₂-VASc',
  copyName: 'CHA₂DS₂-VASc',
  category: 'cardio',
  keywords: ['cha2ds2-vasc', 'chads', 'fibrilacion auricular', 'anticoagulacion', 'acv', 'embolia'],
  population: 'adulto',
  inputs: [
    yesNo('ic', 'Insuficiencia cardíaca / disfunción del VI', 'IC', 1),
    yesNo('hta', 'Hipertensión', 'HTA', 1),
    {
      kind: 'choice', id: 'edad', label: 'Edad', scored: true, omitIfZero: true,
      options: [
        { value: 0, label: '0 · < 65 años', copy: '' },
        { value: 1, label: '1 · 65–74 años', copy: 'edad 65–74' },
        { value: 2, label: '2 · ≥ 75 años', copy: 'edad ≥ 75' },
      ],
    },
    yesNo('dm', 'Diabetes mellitus', 'DM', 1),
    yesNo('acv', 'ACV / AIT / tromboembolia previa', 'ACV/AIT', 2),
    yesNo('vascular', 'Enfermedad vascular (IAM previo, enfermedad arterial periférica, placa aórtica)', 'enf. vascular', 1),
    yesNo('sexo', 'Sexo femenino', 'mujer', 1),
  ],
  compute: (i) => i.ic + i.hta + i.edad + i.dm + i.acv + i.vascular + i.sexo,
  interpret: (t) =>
    t >= 2 ? { label: 'Riesgo alto (≥ 2)', severity: 'danger' }
      : t === 1 ? { label: 'Riesgo intermedio (1)', severity: 'warning' }
        : { label: 'Riesgo bajo (0)', severity: 'info' },
  present: (t) => ({ value: fmt(t), unit: '/ 9' }),
  formula: 'IC 1 · HTA 1 · Edad ≥ 75: 2 · DM 1 · ACV/AIT/TE previa 2 · Enf. vascular 1 · Edad 65–74: 1 · Sexo femenino 1. Rango 0–9.',
  references: [
    { citation: 'Lip GYH, et al. Refining clinical risk stratification for predicting stroke and thromboembolism in atrial fibrillation using a novel risk factor-based approach (Euro Heart Survey). Chest. 2010;137(2):263-272.', doi: '10.1378/chest.09-1584' },
  ],
  warnings: [
    'Categorías de riesgo según la publicación original. Las guías vigentes pueden recomendar umbrales distintos según el sexo; la decisión de anticoagular es clínica.',
    'Se evalúa junto con el riesgo de sangrado.',
  ],
});
