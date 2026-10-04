import { defineCalculator, fmt } from '../helpers';
import { WEIGHT_UNITS } from './units';

interface DoseIn { peso: number; dosisKg: number; concentracion?: number; tope?: number }
interface DoseOut { dosisMg: number; volumenMl?: number; superaTope: boolean; tope?: number }

export const dosePorPeso = ({ peso, dosisKg, concentracion, tope }: DoseIn): DoseOut => {
  const dosisMg = peso * dosisKg;
  return {
    dosisMg,
    volumenMl: concentracion ? dosisMg / concentracion : undefined,
    superaTope: tope !== undefined && dosisMg > tope,
    tope,
  };
};

export const dosis = defineCalculator<DoseIn, DoseOut>({
  id: 'dosis-por-peso',
  name: 'Dosis por peso (mg/kg)',
  copyName: 'Dosis por peso',
  category: 'farmacologia',
  keywords: ['dosis', 'mg/kg', 'peso', 'pediatria', 'volumen', 'concentracion'],
  population: 'todos',
  inputs: [
    { kind: 'number', id: 'peso', label: 'Peso', copy: 'peso {v}', unit: 'kg', units: WEIGHT_UNITS, min: 0.3, max: 400 },
    { kind: 'number', id: 'dosisKg', label: 'Dosis indicada', copy: 'dosis {v}', unit: 'mg/kg', min: 0.0001, max: 10000, help: 'Tomala de la indicación o del protocolo; la app no trae dosis por fármaco.' },
    { kind: 'number', id: 'concentracion', label: 'Concentración (opcional)', copy: 'conc. {v}', unit: 'mg/mL', min: 0.0001, max: 10000, optional: true, help: 'Para obtener el volumen a administrar.' },
    { kind: 'number', id: 'tope', label: 'Dosis máxima (opcional)', copy: 'máx. {v}', unit: 'mg', min: 0.0001, max: 1000000, optional: true },
  ],
  compute: dosePorPeso,
  interpret: (o) =>
    o.superaTope
      ? { label: `Supera la dosis máxima ingresada (${fmt(o.tope ?? 0, 1)} mg)`, severity: 'danger' }
      : { label: o.tope !== undefined ? 'Dentro de la dosis máxima' : 'Sin dosis máxima ingresada', severity: 'info' },
  present: (o) => ({
    value: fmt(o.dosisMg, 2),
    unit: 'mg',
    extra: o.volumenMl !== undefined ? [`Volumen: ${fmt(o.volumenMl, 2)} mL`] : undefined,
    precise: `${o.dosisMg}`,
  }),
  formula: 'Dosis (mg) = peso (kg) × dosis (mg/kg)\nVolumen (mL) = dosis (mg) / concentración (mg/mL)',
  references: [{ citation: 'Cálculo aritmético; no requiere referencia bibliográfica.' }],
  warnings: [
    'Verificá siempre la dosis con el protocolo vigente y la ficha del producto.',
    'El tope lo ingresás vos: si la dosis lo supera, se avisa en rojo pero no se limita el resultado.',
  ],
});

interface InfIn {
  modo: 'volumen' | 'dosis';
  volumen?: number; tiempo?: number; gotero?: number;
  dosisMcg?: number; peso?: number; concentracion?: number;
}
interface InfOut { modo: 'volumen' | 'dosis'; mlPorHora: number; gotasPorMin?: number }

export const infusionCalc = (i: InfIn): InfOut => {
  if (i.modo === 'volumen') {
    const min = i.tiempo as number;
    return {
      modo: 'volumen',
      mlPorHora: ((i.volumen as number) * 60) / min,
      gotasPorMin: ((i.volumen as number) * (i.gotero as number)) / min,
    };
  }
  return {
    modo: 'dosis',
    mlPorHora: ((i.dosisMcg as number) * (i.peso as number) * 60) / (i.concentracion as number),
  };
};

export const infusion = defineCalculator<InfIn, InfOut>({
  id: 'goteo-infusion',
  name: 'Goteo y velocidad de infusión',
  copyName: 'Infusión',
  category: 'liquidos',
  keywords: ['goteo', 'gotas', 'macrogoteo', 'microgoteo', 'infusion', 'ml/h', 'mcg/kg/min', 'bomba'],
  population: 'todos',
  inputs: [
    {
      kind: 'choice', id: 'modo', label: 'Qué querés calcular', default: 'volumen',
      options: [
        { value: 'volumen', label: 'Gotas/min y mL/h a partir de un volumen y un tiempo', copy: 'por volumen' },
        { value: 'dosis', label: 'mL/h a partir de una dosis en mcg/kg/min', copy: 'por dosis' },
      ],
    },
    { kind: 'number', id: 'volumen', label: 'Volumen', copy: '{v}', unit: 'mL', min: 1, max: 20000, showIf: { field: 'modo', equals: 'volumen' } },
    {
      kind: 'number', id: 'tiempo', label: 'Tiempo', copy: 'en {v}', unit: 'min', min: 1, max: 14400,
      units: [{ id: 'min', label: 'min', factor: 1 }, { id: 'h', label: 'h', factor: 60 }],
      showIf: { field: 'modo', equals: 'volumen' },
    },
    {
      kind: 'choice', id: 'gotero', label: 'Equipo', default: 20, showIf: { field: 'modo', equals: 'volumen' },
      options: [
        { value: 20, label: 'Macrogoteo (20 gotas/mL)', copy: 'macro 20' },
        { value: 60, label: 'Microgoteo (60 gotas/mL)', copy: 'micro 60' },
      ],
    },
    { kind: 'number', id: 'dosisMcg', label: 'Dosis', copy: 'dosis {v}', unit: 'mcg/kg/min', min: 0.0001, max: 1000, showIf: { field: 'modo', equals: 'dosis' } },
    { kind: 'number', id: 'peso', label: 'Peso', copy: 'peso {v}', unit: 'kg', units: WEIGHT_UNITS, min: 0.3, max: 400, showIf: { field: 'modo', equals: 'dosis' } },
    { kind: 'number', id: 'concentracion', label: 'Concentración de la mezcla', copy: 'conc. {v}', unit: 'mcg/mL', min: 0.0001, max: 1000000, showIf: { field: 'modo', equals: 'dosis' }, help: '1 mg/mL = 1000 mcg/mL.' },
  ],
  compute: infusionCalc,
  present: (o) =>
    o.gotasPorMin !== undefined
      ? { value: fmt(o.gotasPorMin, 1), unit: 'gotas/min', extra: [`Velocidad: ${fmt(o.mlPorHora, 1)} mL/h`], precise: `${o.gotasPorMin} gotas/min · ${o.mlPorHora} mL/h` }
      : { value: fmt(o.mlPorHora, 2), unit: 'mL/h', precise: `${o.mlPorHora}` },
  formula:
    'Gotas/min = volumen (mL) × gotas/mL / tiempo (min)   (macro 20 · micro 60)\nmL/h = volumen (mL) × 60 / tiempo (min)\nmL/h = dosis (mcg/kg/min) × peso (kg) × 60 / concentración (mcg/mL)',
  references: [{ citation: 'Cálculo aritmético; no requiere referencia bibliográfica.' }],
  warnings: ['Confirmá el factor de goteo en el empaque del equipo y verificá la programación de la bomba.'],
});
