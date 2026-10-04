import type { UnitDef } from '../types';

export const WEIGHT_UNITS: UnitDef[] = [
  { id: 'kg', label: 'kg', factor: 1 },
  { id: 'lb', label: 'lb', factor: 0.45359237 },
];
export const HEIGHT_UNITS: UnitDef[] = [
  { id: 'cm', label: 'cm', factor: 1 },
  { id: 'in', label: 'in', factor: 2.54 },
];
export const CREATININE_UNITS: UnitDef[] = [
  { id: 'mg/dL', label: 'mg/dL', factor: 1 },
  { id: 'µmol/L', label: 'µmol/L', factor: 1 / 88.4 },
];

export const SEX_OPTIONS = [
  { value: 'f', label: 'Mujer' },
  { value: 'm', label: 'Hombre' },
];
