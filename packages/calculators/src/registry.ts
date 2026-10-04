import type { AnyCalculator, Category } from './types';
import { imc } from './calculators/imc';
import { bsa } from './calculators/bsa';
import { ckdEpi2021, cockcroftGault } from './calculators/renal';
import { dosis, infusion } from './calculators/farmacologia';
import { holliday } from './calculators/liquidos';
import { apgar, cha2ds2vasc, glasgow, glasgowPediatrico } from './calculators/escalas';
import { pam } from './calculators/hemodinamica';
import { edadGestacional } from './calculators/obstetricia';

export const calculators: AnyCalculator[] = [
  imc, bsa, ckdEpi2021, cockcroftGault, dosis, infusion, holliday,
  glasgow, glasgowPediatrico, apgar, cha2ds2vasc, pam, edadGestacional,
];

export const getCalculator = (id: string) => calculators.find((c) => c.id === id);

export const categoryLabels: Record<Category, string> = {
  renal: 'Renal', antropometria: 'Antropometría', cardio: 'Cardiovascular', neuro: 'Neurología',
  neonatal: 'Neonatal', obstetricia: 'Obstetricia', hepatico: 'Hepático', infeccioso: 'Infeccioso',
  respiratorio: 'Respiratorio', liquidos: 'Líquidos y goteo', laboratorio: 'Laboratorio', farmacologia: 'Farmacología',
};
