import { defineCalculator } from '../helpers';

interface In { fum: string; referencia: string }
interface Out { fpp: string; semanas: number; dias: number }

const DAY = 86_400_000;
const utc = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Regla de Naegele: FPP = FUM + 280 días. */
export function naegele({ fum, referencia }: In): Out {
  const dias = Math.round((utc(referencia) - utc(fum)) / DAY);
  return { fpp: toIso(utc(fum) + 280 * DAY), semanas: Math.floor(dias / 7), dias: dias % 7 };
}

export const formatDateEs = (iso: string) =>
  new Intl.DateTimeFormat('es-SV', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

export const edadGestacional = defineCalculator<In, Out>({
  id: 'edad-gestacional',
  name: 'Edad gestacional y fecha probable de parto',
  copyName: 'EG/FPP',
  category: 'obstetricia',
  keywords: ['edad gestacional', 'fpp', 'fum', 'naegele', 'embarazo', 'parto', 'semanas'],
  population: 'adulto',
  inputs: [
    { kind: 'date', id: 'fum', label: 'Fecha de última menstruación (FUM)', copy: 'FUM {v}' },
    { kind: 'date', id: 'referencia', label: 'Calcular a la fecha', copy: 'al {v}', default: 'today' },
  ],
  validate: ({ fum, referencia }) =>
    utc(referencia) < utc(fum) ? { referencia: 'La fecha no puede ser anterior a la FUM.' } : undefined,
  compute: naegele,
  interpret: (o) =>
    o.semanas >= 42 ? { label: 'Más de 42 semanas: revisá la fecha', severity: 'warning' }
      : { label: o.semanas >= 37 ? 'A término o más (≥ 37 semanas)' : 'Pretérmino (< 37 semanas)', severity: 'info' },
  present: (o) => ({
    value: `${o.semanas} sem + ${o.dias} d`,
    extra: [`FPP: ${formatDateEs(o.fpp)}`],
    precise: `FPP ${o.fpp}`,
  }),
  formula: 'FPP = FUM + 280 días (equivale a FUM + 1 año − 3 meses + 7 días)\nEdad gestacional = fecha de cálculo − FUM, en semanas y días',
  references: [{ citation: 'Regla de Naegele. TODO(fuente): citar la referencia original o un texto de obstetricia verificable.' }],
  warnings: [
    'Supone ciclos regulares de 28 días y FUM confiable. Si hay discrepancia, confirmá con ecografía temprana.',
    'Las categorías (pretérmino, término) son orientativas.',
  ],
});
