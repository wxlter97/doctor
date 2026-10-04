import type { z } from 'zod';

export type Category =
  | 'renal' | 'antropometria' | 'cardio' | 'neuro' | 'neonatal' | 'obstetricia'
  | 'hepatico' | 'infeccioso' | 'respiratorio' | 'liquidos' | 'laboratorio' | 'farmacologia';

export type Population = 'adulto' | 'pediatrico' | 'neonatal' | 'todos';
export type Severity = 'info' | 'warning' | 'danger';
export type Primitive = string | number;

/** `base = valor * factor`. La unidad base tiene factor 1. */
export interface UnitDef { id: string; label: string; factor: number }

interface BaseInput {
  id: string;
  label: string;
  help?: string;
  /** Plantilla para el texto copiado; `{v}` es el valor. Para números se agrega la unidad. */
  copy?: string;
  /** Solo se muestra (y valida) cuando otro campo tiene cierto valor. */
  showIf?: { field: string; equals: Primitive };
}

export interface NumberInput extends BaseInput {
  kind: 'number';
  /** Unidad base (la que recibe `compute`). */
  unit?: string;
  units?: UnitDef[];
  min: number;
  max: number;
  default?: number;
  integer?: boolean;
  optional?: boolean;
}

export interface ChoiceOption { value: Primitive; label: string; copy?: string }
export interface ChoiceInput extends BaseInput {
  kind: 'choice';
  options: ChoiceOption[];
  default?: Primitive;
  /** Escala por puntos: opciones tocables visibles y suma parcial en vivo. */
  scored?: boolean;
  /** En el texto copiado, omitir el criterio cuando vale 0. */
  omitIfZero?: boolean;
}

export interface DateInput extends BaseInput { kind: 'date'; default?: 'today' }

export type InputDef = NumberInput | ChoiceInput | DateInput;
export type Values = Record<string, Primitive | undefined>;

export interface Interpretation { label: string; severity: Severity }
export interface Presentation {
  value: string;
  unit?: string;
  extra?: string[];
  /** Precisión completa, mostrada en un detalle. */
  precise?: string;
}

export interface Reference { citation: string; doi?: string; url?: string }

export interface CalculatorDef<I, O> {
  id: string;
  name: string;
  /** Texto corto para el copiado (p. ej. "TFG"); por defecto el nombre. */
  copyName?: string;
  category: Category;
  keywords: string[];
  inputs: InputDef[];
  inputSchema: z.ZodType<I>;
  /** Validaciones cruzadas entre campos; devuelve mensajes por campo. */
  validate?: (input: I) => Record<string, string> | undefined;
  compute: (input: I) => O;
  interpret?: (output: O) => Interpretation;
  present: (output: O) => Presentation;
  formula: string;
  references: Reference[];
  warnings?: string[];
  population: Population;
}

export type RunResult<O> =
  | { ok: true; output: O; presentation: Presentation; interpretation?: Interpretation }
  | { ok: false; errors: Record<string, string> };

export type Calculator<I = unknown, O = unknown> = CalculatorDef<I, O> & {
  run: (values: Values) => RunResult<O>;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyCalculator = Calculator<any, any>;
