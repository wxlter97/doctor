import { Baby, Brain, Bug, Droplet, Droplets, FlaskConical, HeartPulse, Ruler, Stethoscope, Syringe, TestTube, Wind, type LucideIcon } from 'lucide-react';

/** Ícono por categoría de calculadora (lista y encabezados). */
export const CATEGORY_ICON: Record<string, LucideIcon> = {
  renal: Droplets, antropometria: Ruler, cardio: HeartPulse, neuro: Brain, neonatal: Baby, obstetricia: Stethoscope,
  hepatico: FlaskConical, infeccioso: Bug, respiratorio: Wind, liquidos: Droplet, laboratorio: TestTube, farmacologia: Syringe,
};
/** Población a la que aplica; «todos» no se muestra. */
export const POPULATION: Record<string, string> = { adulto: 'Adultos', pediatrico: 'Pediatría', neonatal: 'Neonatal' };
