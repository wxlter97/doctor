import { defineCalculator, fmt } from '../helpers';
import { HEIGHT_UNITS, SEX_OPTIONS, WEIGHT_UNITS } from './units';

interface In { sexo: 'f' | 'm'; talla: number; peso?: number }
interface Out { ideal: number; ajustado?: number; porcentajeIdeal?: number }

/** Devine: 50 kg (hombre) o 45.5 kg (mujer) + 2.3 kg por cada pulgada sobre 60. Ajustado = ideal + 0.4 × (real − ideal). */
export function devine({ sexo, talla, peso }: In): Out {
  const ideal = (sexo === 'm' ? 50 : 45.5) + 2.3 * (talla / 2.54 - 60);
  return { ideal, ajustado: peso !== undefined ? ideal + 0.4 * (peso - ideal) : undefined, porcentajeIdeal: peso !== undefined ? (peso / ideal) * 100 : undefined };
}

export const pesoIdeal = defineCalculator<In, Out>({
  id: 'peso-ideal',
  name: 'Peso ideal (Devine) y peso ajustado',
  copyName: 'Peso ideal',
  category: 'antropometria',
  keywords: ['peso ideal', 'devine', 'peso ajustado', 'ibw', 'dosificacion', 'obesidad'],
  population: 'adulto',
  inputs: [
    { kind: 'choice', id: 'sexo', label: 'Sexo', options: SEX_OPTIONS },
    { kind: 'number', id: 'talla', label: 'Talla', copy: 'talla {v}', unit: 'cm', units: HEIGHT_UNITS, min: 152.4, max: 230, help: 'La fórmula se definió para tallas desde 60 pulgadas (152.4 cm).' },
    { kind: 'number', id: 'peso', label: 'Peso real (opcional, para el ajustado)', copy: 'peso {v}', unit: 'kg', units: WEIGHT_UNITS, min: 20, max: 500, optional: true },
  ],
  compute: devine,
  present: (o) => ({
    value: fmt(o.ideal, 1),
    unit: 'kg (ideal)',
    extra: o.ajustado !== undefined ? [`Peso ajustado: ${fmt(o.ajustado, 1)} kg`, `Peso real: ${fmt(o.porcentajeIdeal ?? 0)} % del ideal`] : undefined,
    precise: String(o.ideal),
  }),
  formula: 'Peso ideal (kg) = 50 (hombre) o 45.5 (mujer) + 2.3 × (talla en pulgadas − 60)\nPeso ajustado = ideal + 0.4 × (peso real − ideal)',
  references: [
    { citation: 'Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974;8:650-655.' },
    { citation: 'TODO(fuente): el factor 0.4 del peso ajustado varía según la fuente (0.25–0.4); verificar el que usa tu institución.' },
  ],
  warnings: ['No usar con tallas menores a 152.4 cm: la fórmula extrapola.', 'Qué peso usar (real, ideal o ajustado) depende del fármaco; verificá la ficha.'],
});
