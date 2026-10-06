/**
 * Genera docs/revision-medica.md: el paquete que se le entrega al médico revisor de las calculadoras.
 * Se construye desde el código (registro de calculadoras), así que nunca se desfasa de lo que la app calcula.
 *   pnpm review:packet
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { calculators, categoryLabels, type AnyCalculator, type InputDef, type Values } from '../packages/calculators/src/index';

/** Ejemplo numérico (en unidades base) para que el revisor lo compruebe a mano. */
const EXAMPLES: Record<string, Values> = {
  imc: { peso: 70, talla: 175 },
  bsa: { peso: 70, talla: 170, metodo: 'mosteller' },
  'ckd-epi-2021': { creatinina: 1.2, edad: 54, sexo: 'f' },
  'cockcroft-gault': { edad: 60, peso: 80, creatinina: 1, sexo: 'm' },
  'dosis-por-peso': { peso: 20, dosisKg: 15, concentracion: 24, tope: 500 },
  'goteo-infusion': { modo: 'volumen', volumen: 500, tiempo: 480, gotero: 20 },
  'holliday-segar': { peso: 25 },
  pam: { pas: 120, pad: 80 },
  'edad-gestacional': { fum: '2026-01-01', referencia: '2026-04-11' },
  'child-pugh': { bili: 2.5, alb: 3, inr: 2, ascitis: 2, enc: 2 },
  'meld-na': { cr: 2, bili: 3, inr: 1.5, na: 130, dialisis: 0 },
  'schwartz-bedside': { talla: 140, creatinina: 1 },
  parkland: { peso: 70, sct: 20 },
  'anion-gap': { na: 140, cl: 104, hco3: 24, alb: 2 },
  'sodio-corregido': { na: 130, glucosa: 400, factor: 1.6 },
  'calcio-corregido': { ca: 8, alb: 2.5 },
  osmolaridad: { na: 140, glucosa: 90, bun: 14 },
  'conversion-unidades': { conversion: 'cr-mgdl-umol', valor: 1 },
  'balance-hidrico': { oral: 1000, parenteral: 1000, otrosIngresos: 0, diuresis: 1000, drenajes: 300, otrosEgresos: 200, insensibles: 500 },
  'peso-ideal': { sexo: 'm', talla: 175, peso: 100 },
};

/** Qué debe confirmar el revisor además de la lista general (viene de docs/verificacion.md). */
const SPECIFIC: Record<string, string[]> = {
  imc: ['Los cortes (18.5 / 25 / 30 / 35 / 40) y los nombres de categoría son los de la OMS para adultos.'],
  bsa: ['Fórmulas de Mosteller y DuBois y sus exponentes/constantes.'],
  'ckd-epi-2021': ['Constantes: κ 0.7/0.9, α −0.241/−0.302, −1.200, 0.9938, 1.012 (mujer).', 'Los estadios G1–G5 y sus cortes (90/60/45/30/15).'],
  'cockcroft-gault': ['Factor 0.85 en mujeres y uso del peso real. ¿Conviene advertir peso ideal/ajustado en obesidad?'],
  'dosis-por-peso': ['La advertencia en rojo al superar el tope ingresado y que NO limite el resultado: ¿es el comportamiento seguro?'],
  'goteo-infusion': ['Factores 20 gotas/mL (macro) y 60 (micro); conversión mcg/kg/min → mL/h.'],
  'holliday-segar': ['Tramos 100/50/20 mL/kg/día; advertencias para neonatos y adultos grandes.'],
  glasgow: ['Descriptores y puntajes de apertura ocular, verbal y motora; cortes de gravedad 13–15 / 9–12 / 3–8.'],
  'glasgow-pediatrico': ['Descriptores verbales y motores para preverbales (la fuente pediátrica está pendiente de citar: TODO(fuente)).'],
  apgar: ['Descriptores y puntajes de los 5 criterios; cortes 7–10 / 4–6 / 0–3.'],
  'cha2ds2-vasc': ['Puntajes (IC 1, HTA 1, edad ≥75 2, DM 1, ACV 2, vascular 1, edad 65–74 1, mujer 1) y categorías 0 / 1 / ≥2 de la publicación original.'],
  pam: ['Fórmula (PAS + 2·PAD)/3. La fuente está pendiente de citar: TODO(fuente).'],
  'edad-gestacional': ['FPP = FUM + 280 días; categorías pretérmino (<37) y término. Fuente pendiente: TODO(fuente).'],
  'has-bled': ['Umbrales de función renal (creatinina > 2.26 mg/dL) y hepática; cortes 0–1 / 2 / ≥3.'],
  'curb-65': ['Cortes de urea (> 7 mmol/L; BUN > 19 mg/dL) y PA; el texto de cada categoría de manejo.'],
  'wells-tvp': ['El criterio "TVP previa" es de la versión modificada (2003); ¿se prefiere la original de 1997 sin ese criterio?', 'Cortes: ≤0 baja / 1–2 moderada / ≥3 alta.'],
  'wells-tep': ['Puntajes (3/3/1.5/1.5/1.5/1/1) y cortes: <2, 2–6, >6 y la dicotomía ≤4 / >4.'],
  qsofa: ['Criterios (estado mental, FR ≥22, PAS ≤100) y que ≥2 es positivo.'],
  sofa: ['Tabla completa de los 6 sistemas.', 'En creatinina y bilirrubina usé "≥ 5.0" y "≥ 12.0" para no dejar huecos; la fuente escribe "> 5.0" y "> 12.0".'],
  'child-pugh': ['Cortes de bilirrubina (<2 / 2–3 / >3), albúmina (>3.5 / 2.8–3.5 / <2.8), INR (<1.7 / 1.7–2.3 / >2.3) y las clases A 5–6, B 7–9, C 10–15.'],
  'meld-na': ['Fórmula UNOS 2016: constantes, valores mínimos en 1, Cr máx. 4.0, diálisis, Na acotado 125–137. ¿Se debería ofrecer MELD 3.0?'],
  'schwartz-bedside': ['Constante 0.413 y que aplica a niños con ERC estable.'],
  parkland: ['4 mL × kg × %SCQ y reparto 8 h / 16 h; advertencias sobre niños y hora de la quemadura.'],
  'anion-gap': ['Corrección por albúmina (+2.5 por cada g/dL bajo 4.0): factor pendiente de fuente.'],
  'sodio-corregido': ['Factores 1.6 y 2.4 por cada 100 mg/dL de glucosa sobre 100: ¿cuál debe ser el predeterminado?'],
  'calcio-corregido': ['Factor 0.8 mg/dL por cada g/dL de albúmina bajo 4.0.'],
  osmolaridad: ['Fórmula 2·Na + glucosa/18 + BUN/2.8 y la brecha osmolar. Fuente pendiente: TODO(fuente).'],
  'conversion-unidades': ['Factores 18.016 (glucosa), 88.4 (creatinina), 38.67 (colesterol), 2.8 (BUN → urea mmol/L), 60/28 (BUN → urea mg/dL).'],
  'balance-hidrico': ['¿Es útil mostrar la diuresis en mL/kg/h sin umbrales de oliguria? (no se inventaron cortes).'],
  'peso-ideal': ['Factor 0.4 del peso ajustado (la literatura va de 0.25 a 0.4): ¿cuál usa su institución?'],
};

const inputLine = (i: InputDef): string => {
  if (i.kind === 'number') {
    const units = i.units ? ` · unidades: ${i.units.map((u) => u.label).join(' / ')}` : '';
    return `${i.label}${i.optional ? ' (opcional)' : ''}: ${i.min}–${i.max}${i.unit ? ` ${i.unit}` : ''}${units}${i.integer ? ' · entero' : ''}`;
  }
  if (i.kind === 'choice') return `${i.label}: ${i.options.map((o) => o.label).join(' | ')}`;
  return `${i.label} (fecha)`;
};

function section(c: AnyCalculator): string {
  const out: string[] = [];
  out.push(`### ${c.name}`, '');
  out.push(`- **Categoría:** ${categoryLabels[c.category]} · **Población:** ${c.population} · **Id:** \`${c.id}\``);
  out.push('', '**Entradas que valida la app**', '');
  for (const i of c.inputs) out.push(`- ${inputLine(i)}`);
  out.push('', '**Fórmula / reglas**', '', '```', c.formula, '```', '');
  const ex = EXAMPLES[c.id];
  if (ex) {
    const r = c.run(ex);
    if (r.ok) {
      out.push('**Ejemplo para comprobar a mano**', '');
      out.push(`- Entradas (unidades base): \`${JSON.stringify(ex)}\``);
      out.push(`- Resultado de la app: **${r.presentation.value}${r.presentation.unit ? ' ' + r.presentation.unit : ''}**${r.presentation.extra ? ' · ' + r.presentation.extra.join(' · ') : ''}${r.interpretation ? ` · ${r.interpretation.label}` : ''}`, '');
    }
  }
  out.push('**Referencias citadas**', '');
  for (const r of c.references) out.push(`- ${r.citation}${r.doi ? ` — https://doi.org/${r.doi}` : ''}`);
  if (c.warnings?.length) {
    out.push('', '**Advertencias que muestra la app**', '');
    for (const w of c.warnings) out.push(`- ${w}`);
  }
  out.push('', '**Confirmar (marque cada punto)**', '');
  out.push('- [ ] La fórmula / los puntajes coinciden con la publicación citada.');
  out.push('- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.');
  out.push('- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.');
  out.push('- [ ] Las advertencias son suficientes (población, límites de uso).');
  for (const q of SPECIFIC[c.id] ?? []) out.push(`- [ ] ${q}`);
  out.push('', '**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada', '', '**Cambios pedidos / comentarios:** ', '', '---', '');
  return out.join('\n');
}

const head = `# Paquete de revisión médica de las calculadoras — MedHelp

Generado automáticamente desde el código (\`pnpm review:packet\`). **Ninguna calculadora está marcada como verificada** hasta que usted firme esta hoja.

## Qué se le pide

Para cada una de las ${calculators.length} calculadoras:

1. Comparar la fórmula, los puntajes y los puntos de corte con la publicación citada (los DOI ya se comprobaron: existen y coinciden con la cita; lo que **no** se comprobó es el contenido).
2. Comprobar a mano el ejemplo numérico, cuando lo hay.
3. Revisar que los textos de interpretación y las advertencias no induzcan a error en la práctica.
4. Dar un veredicto y anotar los cambios que pida.

Tiempo estimado: unos 10–15 minutos por calculadora (≈ 5–7 horas en total). Se puede repartir por especialidad: **medicina interna/nefrología** (renal, hepático, cardio, laboratorio), **pediatría/neonatología** (Holliday-Segar, Schwartz, Glasgow pediátrico, APGAR, dosis por peso), **obstetricia** (edad gestacional), **cuidados críticos/urgencias** (Glasgow, SOFA, qSOFA, Parkland, balance hídrico, Wells, CURB-65).

## Datos del revisor (se guardan solo las iniciales y la fecha)

- Nombre: ____________________  Especialidad: ____________________
- N.º de registro profesional (JVPM, opcional): ____________
- Iniciales para la app: ______  Fecha: ____/____/________
- Alcance revisado (calculadoras): ______________________________

## Límites de lo revisado

La app es una herramienta de apoyo; no sustituye el juicio clínico. La revisión confirma que **la app calcula lo que la fuente dice**, no que sea adecuada para un paciente concreto.

---

## Índice

${calculators.map((c, n) => `${n + 1}. ${c.name}`).join('\n')}

---

`;

writeFileSync(join(import.meta.dirname, '..', 'docs/revision-medica.md'), head + calculators.map(section).join('\n'));
console.log(`docs/revision-medica.md generado (${calculators.length} calculadoras).`);
