import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, ChevronLeft, Copy, Star } from 'lucide-react';
import { buildCopyText, getCalculator, isVisible, type AnyCalculator, type InputDef, type Values } from '@medapoyo/calculators';
import { db } from '../../db';
import { addHistory, toggleFavorite, touchRecent } from '../../db/user';
import { t } from '../../i18n/es-SV';
import { ChoiceField, DateField, NumberField } from './Fields';
import { Section } from './Section';
import { SeverityBadge } from './Severity';

interface FormState { raw: Record<string, string>; units: Record<string, string> }

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function initialState(calc: AnyCalculator): FormState {
  const raw: Record<string, string> = {};
  const units: Record<string, string> = {};
  for (const i of calc.inputs) {
    if (i.kind === 'number') {
      raw[i.id] = i.default !== undefined ? String(i.default) : '';
      if (i.units) units[i.id] = i.units.find((u) => u.factor === 1)?.id ?? i.units[0]!.id;
    } else if (i.kind === 'choice') raw[i.id] = i.default !== undefined ? String(i.default) : '';
    else raw[i.id] = i.default === 'today' ? todayIso() : '';
  }
  return { raw, units };
}

/** Convierte lo tipeado (en la unidad elegida) a valores en unidad base. */
function toValues(calc: AnyCalculator, s: FormState): Values {
  const v: Values = {};
  for (const i of calc.inputs) {
    const r = s.raw[i.id] ?? '';
    if (r === '') continue;
    if (i.kind === 'number') {
      const factor = i.units?.find((u) => u.id === s.units[i.id])?.factor ?? 1;
      v[i.id] = Number(r) * factor;
    } else v[i.id] = r;
  }
  return v;
}

export function CalculatorPage() {
  const { id = '' } = useParams();
  const calc = getCalculator(id);
  if (!calc) return <p className="card">{t.calculators.notFound} <Link className="underline" to="/calculadoras">{t.calculators.title}</Link></p>;
  return <CalculatorView key={calc.id} calc={calc} />;
}

function CalculatorView({ calc }: { calc: AnyCalculator }) {
  const [state, setState] = useState<FormState>(() => initialState(calc));
  const [copied, setCopied] = useState(false);
  const c = t.calculators;

  useEffect(() => { void touchRecent('calculator', calc.id); }, [calc.id]);

  const values = useMemo(() => toValues(calc, state), [calc, state]);
  const result = useMemo(() => calc.run(values), [calc, values]);
  const visible = calc.inputs.filter((i) => isVisible(i, values));

  const copyText = useMemo(() => {
    if (!result.ok) return '';
    const entries: Record<string, { raw: string; unitLabel?: string }> = {};
    for (const i of visible) {
      const unitLabel = i.kind === 'number' ? (i.units?.find((u) => u.id === state.units[i.id])?.label ?? i.unit) : undefined;
      entries[i.id] = { raw: state.raw[i.id] ?? '', unitLabel };
    }
    return buildCopyText(calc, entries, result.presentation, result.interpretation);
  }, [calc, result, state, visible]);

  // Historial: guarda el resultado válido tras una pausa, sin duplicar el último.
  const lastSaved = useRef('');
  useEffect(() => {
    if (!result.ok) return;
    const timer = setTimeout(() => {
      if (copyText === lastSaved.current) return;
      lastSaved.current = copyText;
      void addHistory({
        calculatorId: calc.id,
        createdAt: Date.now(),
        input: { raw: state.raw, units: state.units },
        output: { presentation: result.presentation, interpretation: result.interpretation ?? null, text: copyText },
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [calc.id, copyText, result, state]);

  const isFav = useLiveQuery(async () => !!(await db.favorites.get(['calculator', calc.id])), [calc.id]);
  const history = useLiveQuery(
    () => db.calcHistory.where('calculatorId').equals(calc.id).reverse().sortBy('createdAt').then((r) => r.slice(0, 10)),
    [calc.id],
  );

  const errors = result.ok ? {} : result.errors;
  const set = (id: string, v: string) => setState((s) => ({ ...s, raw: { ...s.raw, [id]: v } }));
  const setUnit = (i: InputDef, unitId: string) => setState((s) => {
    if (i.kind !== 'number' || !i.units) return s;
    const from = i.units.find((u) => u.id === s.units[i.id])?.factor ?? 1;
    const to = i.units.find((u) => u.id === unitId)?.factor ?? 1;
    const n = Number(s.raw[i.id]);
    const raw = s.raw[i.id] && Number.isFinite(n) ? String(Number(((n * from) / to).toPrecision(6))) : (s.raw[i.id] ?? '');
    return { raw: { ...s.raw, [i.id]: raw }, units: { ...s.units, [i.id]: unitId } };
  });

  const partial = calc.inputs.filter((i) => i.kind === 'choice' && i.scored && state.raw[i.id] !== '')
    .reduce((sum, i) => sum + Number(state.raw[i.id]), 0);
  const hasScored = calc.inputs.some((i) => i.kind === 'choice' && i.scored);

  const copy = async () => {
    try { await navigator.clipboard.writeText(copyText); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* sin permiso */ }
  };

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-8">
      <div className="flex flex-col gap-4 pb-4">
        <Link to="/calculadoras" className="inline-flex min-h-11 items-center gap-1 font-bold underline"><ChevronLeft aria-hidden size={18} /> {c.title}</Link>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold">{calc.name}</h1>
          <button className="btn shrink-0" aria-pressed={!!isFav} aria-label={isFav ? c.unfavorite : c.favorite} onClick={() => void toggleFavorite('calculator', calc.id)}>
            <Star aria-hidden size={20} fill={isFav ? 'currentColor' : 'none'} />
          </button>
        </div>

        <form className="card flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          {visible.map((i) =>
            i.kind === 'number' ? (
              <NumberField key={i.id} input={i} raw={state.raw[i.id] ?? ''} unitId={state.units[i.id] ?? ''}
                error={state.raw[i.id] ? errors[i.id] : undefined} onChange={(v) => set(i.id, v)} onUnit={(u) => setUnit(i, u)} />
            ) : i.kind === 'choice' ? (
              <ChoiceField key={i.id} input={i} raw={state.raw[i.id] ?? ''} onChange={(v) => set(i.id, v)} />
            ) : (
              <DateField key={i.id} input={i} raw={state.raw[i.id] ?? ''} error={state.raw[i.id] ? errors[i.id] : undefined} onChange={(v) => set(i.id, v)} />
            ),
          )}
          {hasScored && <p className="font-bold" aria-live="polite">{c.partialSum}: {partial}</p>}
        </form>

        <Section title={c.formula}><pre className="font-mono text-sm whitespace-pre-wrap">{calc.formula}</pre></Section>
        <Section title={c.references}>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {calc.references.map((r) => (
              <li key={r.citation}>{r.citation}{r.doi && <> · <a className="underline" href={`https://doi.org/${r.doi}`} target="_blank" rel="noreferrer">doi:{r.doi}</a></>}</li>
            ))}
          </ul>
        </Section>
        {calc.warnings && calc.warnings.length > 0 && (
          <Section title={c.warnings}><ul className="list-disc space-y-2 pl-5 text-sm">{calc.warnings.map((w) => <li key={w}>{w}</li>)}</ul></Section>
        )}
        {history && history.length > 0 && (
          <Section title={c.history}>
            <ul className="flex flex-col gap-2">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>{(h.output as { text: string }).text}</span>
                  <button className="btn shrink-0" onClick={() => { const i = h.input as FormState; setState({ raw: i.raw, units: i.units }); }}>{c.load}</button>
                </li>
              ))}
            </ul>
          </Section>
        )}
        <p className="text-sm text-muted">{t.disclaimer.short}</p>
      </div>

      <aside aria-live="polite" className="sticky bottom-0 -mx-4 border-t-2 border-line bg-surface px-4 py-3 lg:top-0 lg:mx-0 lg:border-2 lg:p-4 lg:shadow-[var(--shadow)]">
        <h2 className="sr-only">{c.result}</h2>
        {result.ok ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-stretch lg:gap-2">
              <p className="text-2xl font-black lg:text-3xl">{result.presentation.value} <span className="text-base font-bold">{result.presentation.unit}</span></p>
              <button className="btn btn-primary shrink-0" onClick={() => void copy()}>
                {copied ? <Check aria-hidden size={18} /> : <Copy aria-hidden size={18} />} {copied ? c.copied : c.copy}
              </button>
            </div>
            {result.presentation.extra?.map((e) => <p key={e} className="text-sm font-bold lg:text-base">{e}</p>)}
            {result.interpretation && <SeverityBadge {...result.interpretation} />}
            {result.presentation.precise && (
              <details className="hidden text-sm lg:block"><summary className="min-h-11 cursor-pointer py-2">{c.precision}</summary>{result.presentation.precise}</details>
            )}
          </div>
        ) : (
          <p className="text-muted">
            {c.fillFields}
            {hasScored && <strong className="ml-2 text-fg">· {c.partialSum}: {partial}</strong>}
          </p>
        )}
      </aside>
    </div>
  );
}
