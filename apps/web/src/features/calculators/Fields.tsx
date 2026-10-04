import type { ChoiceInput, DateInput, NumberInput } from '@medapoyo/calculators';

const fmtRange = (n: number) => String(Number(n.toPrecision(4)));

export function NumberField({ input, raw, unitId, error, onChange, onUnit }: {
  input: NumberInput; raw: string; unitId: string; error?: string;
  onChange: (v: string) => void; onUnit: (u: string) => void;
}) {
  const factor = input.units?.find((u) => u.id === unitId)?.factor ?? 1;
  const unitLabel = input.units?.find((u) => u.id === unitId)?.label ?? input.unit;
  const help = `Rango: ${fmtRange(input.min / factor)}–${fmtRange(input.max / factor)}${unitLabel ? ` ${unitLabel}` : ''}`;
  const id = `f-${input.id}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-bold">{input.label}</label>
      <div className="flex gap-2">
        <input
          id={id} className="field" inputMode="decimal" autoComplete="off" value={raw}
          aria-invalid={!!error} aria-describedby={`${id}-help`}
          onChange={(e) => onChange(e.target.value.replace(',', '.'))}
        />
        {input.units ? (
          <select aria-label={`Unidad de ${input.label.toLowerCase()}`} className="field w-28 shrink-0" value={unitId} onChange={(e) => onUnit(e.target.value)}>
            {input.units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        ) : (
          input.unit && <span className="flex min-w-14 items-center text-muted">{input.unit}</span>
        )}
      </div>
      <p id={`${id}-help`} className={`text-sm ${error ? 'font-bold text-danger' : 'text-muted'}`}>
        {error ? `✖ ${error}` : input.help ? `${input.help} · ${help}` : help}
      </p>
    </div>
  );
}

export function ChoiceField({ input, raw, onChange }: { input: ChoiceInput; raw: string; onChange: (v: string) => void }) {
  const tiles = input.scored || input.options.length <= 4;
  if (!tiles) {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={`f-${input.id}`} className="font-bold">{input.label}</label>
        <select id={`f-${input.id}`} className="field" value={raw} onChange={(e) => onChange(e.target.value)}>
          <option value="">Elegí una opción</option>
          {input.options.map((o) => <option key={o.value} value={String(o.value)}>{o.label}</option>)}
        </select>
      </div>
    );
  }
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 font-bold">{input.label}</legend>
      <div role="radiogroup" aria-label={input.label} className="grid gap-2">
        {input.options.map((o) => {
          const selected = String(o.value) === raw;
          return (
            <button
              key={String(o.value)} type="button" role="radio" aria-checked={selected}
              onClick={() => onChange(String(o.value))}
              className={`btn justify-start text-left ${selected ? 'btn-primary' : ''}`}
            >
              <span aria-hidden>{selected ? '●' : '○'}</span> {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function DateField({ input, raw, error, onChange }: { input: DateInput; raw: string; error?: string; onChange: (v: string) => void }) {
  const id = `f-${input.id}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-bold">{input.label}</label>
      <input id={id} type="date" className="field" value={raw} aria-invalid={!!error} onChange={(e) => onChange(e.target.value)} />
      {error && <p className="text-sm font-bold text-danger">✖ {error}</p>}
    </div>
  );
}
