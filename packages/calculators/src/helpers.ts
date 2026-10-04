import { z } from 'zod';
import type {
  AnyCalculator, Calculator, CalculatorDef, ChoiceInput, InputDef, Primitive, Values,
} from './types';

export const fmt = (x: number, decimals = 0) => x.toFixed(decimals);
export const round = (x: number, decimals = 0) => Number(x.toFixed(decimals));

export function isVisible(input: InputDef, values: Values): boolean {
  if (!input.showIf) return true;
  return String(values[input.showIf.field]) === String(input.showIf.equals);
}

function fieldSchema(input: InputDef, strict = false): z.ZodType {
  const issue = (ctx: z.RefinementCtx, message: string) => ctx.addIssue({ code: 'custom', message });
  let schema: z.ZodType;
  if (input.kind === 'number') {
    const unit = input.unit ? ` ${input.unit}` : '';
    schema = z.unknown().superRefine((v, ctx) => {
      if (v === undefined || v === null || v === '') {
        if (!input.optional) issue(ctx, `Ingresá ${input.label.toLowerCase()}.`);
        return;
      }
      if (typeof v !== 'number' || !Number.isFinite(v)) return issue(ctx, 'Ingresá un número válido.');
      if (input.integer && !Number.isInteger(v)) return issue(ctx, 'Tiene que ser un número entero.');
      if (v < input.min || v > input.max) {
        issue(ctx, `Debe estar entre ${input.min} y ${input.max}${unit}.`);
      }
    });
  } else if (input.kind === 'choice') {
    const allowed = new Map<string, Primitive>(input.options.map((o) => [String(o.value), o.value]));
    schema = z.unknown().transform((v, ctx) => {
      const found = v === undefined ? undefined : allowed.get(String(v));
      if (found === undefined) {
        ctx.addIssue({ code: 'custom', message: 'Elegí una opción.' });
        return z.NEVER;
      }
      return found;
    });
  } else {
    schema = z.unknown().superRefine((v, ctx) => {
      if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) {
        issue(ctx, 'Ingresá una fecha válida.');
      }
    });
  }
  if ((!strict && input.showIf) || (input.kind === 'number' && input.optional)) schema = schema.optional();
  return schema;
}

/** Esquema zod generado a partir de las definiciones de campos. */
export function schemaFromInputs<I>(inputs: InputDef[]): z.ZodType<I> {
  const shape: Record<string, z.ZodType> = {};
  for (const input of inputs) shape[input.id] = fieldSchema(input);
  return z.object(shape) as unknown as z.ZodType<I>;
}

export function defineCalculator<I, O>(
  def: Omit<CalculatorDef<I, O>, 'inputSchema'> & { inputSchema?: z.ZodType<I> },
): Calculator<I, O> {
  const inputSchema = def.inputSchema ?? schemaFromInputs<I>(def.inputs);
  const full = { ...def, inputSchema } as CalculatorDef<I, O>;
  return {
    ...full,
    run(values) {
      const visible: Values = {};
      for (const input of def.inputs) {
        if (!isVisible(input, values)) continue;
        const v = values[input.id];
        if (v !== undefined) visible[input.id] = v;
      }
      // Los campos condicionales son opcionales en el esquema; si están visibles, son obligatorios.
      const errors: Record<string, string> = {};
      for (const input of def.inputs) {
        if (!input.showIf || !isVisible(input, values)) continue;
        const r = fieldSchema(input, true).safeParse(visible[input.id]);
        if (!r.success) errors[input.id] = r.error.issues[0]?.message ?? 'Valor inválido.';
      }
      if (Object.keys(errors).length > 0) return { ok: false, errors };
      const parsed = inputSchema.safeParse(visible);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const key = String(issue.path[0] ?? '_');
          errors[key] ??= issue.message;
        }
        return { ok: false, errors };
      }
      const cross = def.validate?.(parsed.data);
      if (cross && Object.keys(cross).length > 0) return { ok: false, errors: cross };
      const output = def.compute(parsed.data);
      return {
        ok: true,
        output,
        presentation: def.present(output),
        interpretation: def.interpret?.(output),
      };
    },
  };
}

export interface DisplayEntry { raw: string; unitLabel?: string }

/** Texto listo para pegar en una nota. Nunca incluye datos de pacientes. */
export function buildCopyText(
  calc: AnyCalculator,
  entries: Record<string, DisplayEntry>,
  presentation: { value: string; unit?: string },
  interpretation?: { label: string },
): string {
  const parts: string[] = [];
  for (const input of calc.inputs) {
    const entry = entries[input.id];
    if (!entry || entry.raw === '') continue;
    if (input.kind === 'choice') {
      const opt = input.options.find((o) => String(o.value) === entry.raw);
      if (!opt) continue;
      if ((input as ChoiceInput).omitIfZero && Number(opt.value) === 0) continue;
      parts.push((input.copy ?? '{v}').replace('{v}', opt.copy ?? (input.scored ? entry.raw : opt.label.toLowerCase())));
    } else {
      const text = (input.copy ?? input.label).replace('{v}', entry.raw);
      parts.push(entry.unitLabel ? `${text} ${entry.unitLabel}` : text);
    }
  }
  const result = `${presentation.value}${presentation.unit ? ` ${presentation.unit}` : ''}`;
  const interp = interpretation ? ` (${interpretation.label})` : '';
  return `${calc.copyName ?? calc.name}: ${parts.join(', ')} → ${result}${interp}`;
}
