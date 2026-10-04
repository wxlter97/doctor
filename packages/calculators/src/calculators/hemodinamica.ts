import { defineCalculator, fmt } from '../helpers';

interface In { pas: number; pad: number }

export const pam = defineCalculator<In, number>({
  id: 'pam',
  name: 'Presión arterial media (PAM)',
  copyName: 'PAM',
  category: 'cardio',
  keywords: ['pam', 'presion arterial media', 'map', 'hemodinamia', 'perfusion'],
  population: 'todos',
  inputs: [
    { kind: 'number', id: 'pas', label: 'Presión sistólica', copy: 'PAS {v}', unit: 'mmHg', min: 40, max: 300, integer: true },
    { kind: 'number', id: 'pad', label: 'Presión diastólica', copy: 'PAD {v}', unit: 'mmHg', min: 20, max: 200, integer: true },
  ],
  validate: ({ pas, pad }) => (pad >= pas ? { pad: 'La diastólica tiene que ser menor que la sistólica.' } : undefined),
  compute: ({ pas, pad }) => (pas + 2 * pad) / 3,
  present: (v) => ({ value: fmt(v), unit: 'mmHg', precise: String(v) }),
  formula: 'PAM = (PAS + 2 × PAD) / 3',
  references: [{ citation: 'Fórmula estándar de hemodinámica. TODO(fuente): citar un texto de referencia verificable.' }],
  warnings: ['Estimación a partir de presiones no invasivas; la medición invasiva puede diferir.'],
});
