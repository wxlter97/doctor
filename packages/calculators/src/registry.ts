import type { AnyCalculator, Category } from './types';
import { imc } from './calculators/imc';
import { bsa } from './calculators/bsa';
import { ckdEpi2021, cockcroftGault, schwartz } from './calculators/renal';
import { dosis, infusion } from './calculators/farmacologia';
import { balance, holliday, parklandCalc } from './calculators/liquidos';
import { hasBled, curb65, wellsDvt, wellsPe, qsofa, sofa } from './calculators/riesgo';
import { childPugh, meld } from './calculators/hepatico';
import { anionGap, calcioCorregido, conversionUnidades, osmolaridad, sodioCorregido } from './calculators/laboratorio';
import { pesoIdeal } from './calculators/peso-ideal';
import { apgar, cha2ds2vasc, glasgow, glasgowPediatrico } from './calculators/escalas';
import { pam } from './calculators/hemodinamica';
import { edadGestacional } from './calculators/obstetricia';

export const calculators: AnyCalculator[] = [
  imc, bsa, ckdEpi2021, cockcroftGault, dosis, infusion, holliday,
  glasgow, glasgowPediatrico, apgar, cha2ds2vasc, pam, edadGestacional,
  // Fase 5
  hasBled, curb65, wellsDvt, wellsPe, childPugh, meld, qsofa, sofa, schwartz, parklandCalc,
  anionGap, sodioCorregido, calcioCorregido, osmolaridad, balance, conversionUnidades, pesoIdeal,
];

export const getCalculator = (id: string) => calculators.find((c) => c.id === id);

export const categoryLabels: Record<Category, string> = {
  renal: 'Renal', antropometria: 'Antropometría', cardio: 'Cardiovascular', neuro: 'Neurología',
  neonatal: 'Neonatal', obstetricia: 'Obstetricia', hepatico: 'Hepático', infeccioso: 'Infeccioso',
  respiratorio: 'Respiratorio', liquidos: 'Líquidos y goteo', laboratorio: 'Laboratorio', farmacologia: 'Farmacología',
};
