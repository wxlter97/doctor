import { describe, expect, it } from 'vitest';
import { balance, balanceHidrico, parkland, parklandCalc } from './liquidos';
import { childPugh, childPughClass, cpPoints, meld, meldNa } from './hepatico';
import { anionGap, anionGapCalc, calcioCorregido, calcioCorregidoCalc, conversionUnidades, convertir, osmolaridad, osmolaridadCalc, sodioCorregido, sodioCorregidoCalc } from './laboratorio';
import { curb65, hasBled, qsofa, sofa, wellsDvt, wellsDvtInterpret, wellsPe, wellsPeInterpret } from './riesgo';
import { devine, pesoIdeal } from './peso-ideal';
import { schwartz, schwartzEgfr } from './renal';

// Valores esperados calculados a mano con las fórmulas (pendiente cotejar con las publicaciones: docs/verificacion.md).

const ones = <T extends string>(keys: T[], v = 0) => Object.fromEntries(keys.map((k) => [k, v])) as Record<T, number>;

describe('HAS-BLED', () => {
  const keys = ['hta', 'renal', 'hepatica', 'acv', 'sangrado', 'inr', 'edad', 'drogas', 'alcohol'] as const;
  it('0 y 9 en los extremos', () => {
    const lo = hasBled.run(ones([...keys]));
    const hi = hasBled.run(ones([...keys], 1));
    expect(lo.ok && lo.output).toBe(0);
    expect(hi.ok && hi.output).toBe(9);
  });
  it('categorías en los bordes (1, 2, 3)', () => {
    const at = (n: number) => { const o = ones([...keys]); keys.slice(0, n).forEach((k) => (o[k] = 1)); const r = hasBled.run(o); return r.ok ? r.interpretation?.severity : undefined; };
    expect([at(1), at(2), at(3)]).toEqual(['info', 'warning', 'danger']);
  });
  it('rechaza un valor distinto de 0/1', () => {
    expect(hasBled.run({ ...ones([...keys]), hta: 2 }).ok).toBe(false);
  });
});

describe('CURB-65', () => {
  const keys = ['confusion', 'urea', 'fr', 'pa', 'edad'] as const;
  it('0, 2 y 5 puntos', () => {
    const run = (n: number) => { const o = ones([...keys]); keys.slice(0, n).forEach((k) => (o[k] = 1)); return curb65.run(o); };
    const [a, b, c] = [run(0), run(2), run(5)];
    expect(a.ok && a.output).toBe(0);
    expect(b.ok && b.interpretation?.severity).toBe('warning');
    expect(c.ok && c.output).toBe(5);
    expect(c.ok && c.interpretation?.severity).toBe('danger');
  });
  it('1 punto sigue siendo riesgo bajo', () => {
    const r = curb65.run({ ...ones([...keys]), edad: 1 });
    expect(r.ok && r.interpretation?.severity).toBe('info');
  });
});

describe('Wells TVP', () => {
  const keys = ['cancer', 'paralisis', 'cama', 'dolor', 'pierna', 'pantorrilla', 'edema', 'colaterales', 'previa', 'alternativo'] as const;
  it('3 criterios = alta; 2 criterios con alternativo = 0 (baja)', () => {
    const a = wellsDvt.run({ ...ones([...keys]), cancer: 1, dolor: 1, pierna: 1 });
    expect(a.ok && a.output).toBe(3);
    expect(a.ok && a.interpretation?.severity).toBe('danger');
    const b = wellsDvt.run({ ...ones([...keys]), cancer: 1, dolor: 1, alternativo: -2 });
    expect(b.ok && b.output).toBe(0);
    expect(b.ok && b.interpretation?.severity).toBe('info');
  });
  it('mínimo −2 y máximo 9', () => {
    const lo = wellsDvt.run({ ...ones([...keys]), alternativo: -2 });
    const hi = wellsDvt.run({ ...ones([...keys], 1), alternativo: 0 });
    expect(lo.ok && lo.output).toBe(-2);
    expect(hi.ok && hi.output).toBe(9);
  });
  it('bordes 0/1 y 2/3; rechaza alternativo = 1', () => {
    expect([wellsDvtInterpret(0).severity, wellsDvtInterpret(1).severity, wellsDvtInterpret(2).severity, wellsDvtInterpret(3).severity]).toEqual(['info', 'warning', 'warning', 'danger']);
    expect(wellsDvt.run({ ...ones([...keys]), alternativo: 1 }).ok).toBe(false);
  });
});

describe('Wells TEP', () => {
  const keys = ['tvp', 'probable', 'fc', 'inmov', 'previo', 'hemoptisis', 'cancer'] as const;
  it('signos de TVP + FC > 100 = 4.5 (moderada, TEP probable)', () => {
    const r = wellsPe.run({ ...ones([...keys]), tvp: 3, fc: 1.5 });
    expect(r.ok && r.output).toBe(4.5);
    expect(r.ok && r.interpretation?.label).toContain('probable (> 4)');
  });
  it('bordes de 2, 4, 4.5, 6 y 6.5', () => {
    expect(wellsPeInterpret(1.5).severity).toBe('info');
    expect(wellsPeInterpret(2).severity).toBe('warning');
    expect(wellsPeInterpret(4).label).toContain('improbable');
    expect(wellsPeInterpret(6).severity).toBe('warning');
    expect(wellsPeInterpret(6.5).severity).toBe('danger');
  });
  it('máximo 12.5 y rechaza puntajes no listados', () => {
    const hi = wellsPe.run({ tvp: 3, probable: 3, fc: 1.5, inmov: 1.5, previo: 1.5, hemoptisis: 1, cancer: 1 });
    expect(hi.ok && hi.output).toBe(12.5);
    expect(wellsPe.run({ ...ones([...keys]), fc: 1 }).ok).toBe(false);
  });
});

describe('qSOFA y SOFA', () => {
  it('qSOFA: 2 criterios = positivo; 1 = negativo', () => {
    const pos = qsofa.run({ mentacion: 1, fr: 1, pas: 0 });
    const neg = qsofa.run({ mentacion: 0, fr: 1, pas: 0 });
    expect(pos.ok && pos.interpretation?.severity).toBe('danger');
    expect(neg.ok && neg.interpretation?.severity).toBe('info');
  });
  it('SOFA: suma de seis sistemas, 0–24', () => {
    const lo = sofa.run(ones(['resp', 'coag', 'higado', 'cardio', 'snc', 'renal']));
    const hi = sofa.run(ones(['resp', 'coag', 'higado', 'cardio', 'snc', 'renal'], 4));
    const mid = sofa.run({ resp: 2, coag: 1, higado: 0, cardio: 3, snc: 1, renal: 2 });
    expect(lo.ok && lo.output).toBe(0);
    expect(hi.ok && hi.output).toBe(24);
    expect(mid.ok && mid.output).toBe(9);
  });
  it('SOFA rechaza valores fuera de 0–4', () => {
    expect(sofa.run({ ...ones(['resp', 'coag', 'higado', 'cardio', 'snc', 'renal']), resp: 5 }).ok).toBe(false);
  });
});

describe('Child-Pugh', () => {
  it('bordes de bilirrubina, albúmina e INR', () => {
    expect([cpPoints.bili(1.9), cpPoints.bili(2), cpPoints.bili(3), cpPoints.bili(3.01)]).toEqual([1, 2, 2, 3]);
    expect([cpPoints.alb(3.51), cpPoints.alb(3.5), cpPoints.alb(2.8), cpPoints.alb(2.79)]).toEqual([1, 2, 2, 3]);
    expect([cpPoints.inr(1.69), cpPoints.inr(1.7), cpPoints.inr(2.3), cpPoints.inr(2.31)]).toEqual([1, 2, 2, 3]);
  });
  it('5 puntos = A; 10 puntos = C', () => {
    const a = childPugh.run({ bili: 1, alb: 4, inr: 1, ascitis: 1, enc: 1 });
    expect(a.ok && a.output).toBe(5);
    expect(a.ok && a.interpretation?.label).toContain('Clase A');
    const c = childPugh.run({ bili: 2.5, alb: 3, inr: 2, ascitis: 2, enc: 2 });
    expect(c.ok && c.output).toBe(10);
    expect(c.ok && c.interpretation?.label).toContain('Clase C');
  });
  it('clases en 6/7 y 9/10', () => {
    expect([childPughClass(6), childPughClass(7), childPughClass(9), childPughClass(10)]).toEqual(['A', 'B', 'B', 'C']);
  });
  it('rechaza ascitis fuera de opciones', () => {
    expect(childPugh.run({ bili: 1, alb: 4, inr: 1, ascitis: 0, enc: 1 }).ok).toBe(false);
  });
});

describe('MELD-Na', () => {
  it('Cr 1, bili 1, INR 1 → MELD 6 (sin ajuste de sodio porque MELD ≤ 11)', () => {
    expect(meldNa({ cr: 1, bili: 1, inr: 1, na: 130, dialisis: 0 })).toEqual({ meld: 6, meldNa: 6 });
  });
  it('Cr 2, bili 3, INR 1.5, Na 130 → MELD 22, MELD-Na 26', () => {
    expect(meldNa({ cr: 2, bili: 3, inr: 1.5, na: 130, dialisis: 0 })).toEqual({ meld: 22, meldNa: 26 });
  });
  it('acota: Cr máx. 4, diálisis = 4, Na entre 125 y 137, valores < 1 → 1', () => {
    expect(meldNa({ cr: 9, bili: 3, inr: 1.5, na: 130, dialisis: 0 })).toEqual(meldNa({ cr: 4, bili: 3, inr: 1.5, na: 130, dialisis: 0 }));
    expect(meldNa({ cr: 1, bili: 3, inr: 1.5, na: 130, dialisis: 1 })).toEqual(meldNa({ cr: 4, bili: 3, inr: 1.5, na: 130, dialisis: 0 }));
    expect(meldNa({ cr: 2, bili: 3, inr: 1.5, na: 110, dialisis: 0 })).toEqual(meldNa({ cr: 2, bili: 3, inr: 1.5, na: 125, dialisis: 0 }));
    expect(meldNa({ cr: 2, bili: 3, inr: 1.5, na: 150, dialisis: 0 }).meldNa).toBe(22);
    expect(meldNa({ cr: 0.5, bili: 0.4, inr: 0.9, na: 137, dialisis: 0 }).meld).toBe(6);
  });
  it('run valida rangos', () => {
    expect(meld.run({ cr: 2, bili: 3, inr: 1.5, na: 130, dialisis: 0 }).ok).toBe(true);
    expect(meld.run({ cr: 2, bili: 3, inr: 1.5, na: 90, dialisis: 0 }).ok).toBe(false);
  });
});

describe('Schwartz bedside', () => {
  it('100 cm, Cr 0.5 → 82.6', () => {
    expect(schwartzEgfr({ talla: 100, creatinina: 0.5 })).toBeCloseTo(82.6, 6);
  });
  it('140 cm, Cr 1.0 → 57.8; presentación con un decimal', () => {
    const r = schwartz.run({ talla: 140, creatinina: 1 });
    expect(r.ok && r.presentation.value).toBe('57.8');
  });
  it('rechaza talla de adulto grande o Cr fuera de rango', () => {
    expect(schwartz.run({ talla: 30, creatinina: 1 }).ok).toBe(false);
    expect(schwartz.run({ talla: 100, creatinina: 0.1 }).ok).toBe(false);
  });
});

describe('Parkland', () => {
  it('70 kg, 20 % → 5600 mL; 2800 en 8 h (350 mL/h) y 2800 en 16 h (175 mL/h)', () => {
    expect(parkland({ peso: 70, sct: 20 })).toEqual({ totalMl: 5600, primeras8Ml: 2800, mlHora8: 350, siguientes16Ml: 2800, mlHora16: 175 });
  });
  it('presenta total y mitades', () => {
    const r = parklandCalc.run({ peso: 70, sct: 20 });
    expect(r.ok && r.presentation.value).toBe('5600');
    expect(r.ok && r.presentation.extra?.[0]).toContain('350.0 mL/h');
  });
  it('límites 1–100 %', () => {
    expect(parklandCalc.run({ peso: 70, sct: 100 }).ok).toBe(true);
    expect(parklandCalc.run({ peso: 70, sct: 0 }).ok).toBe(false);
    expect(parklandCalc.run({ peso: 70, sct: 101 }).ok).toBe(false);
  });
});

describe('Fórmulas de laboratorio', () => {
  it('anion gap 140/104/24 = 12; corregido con albúmina 2.0 = 17', () => {
    expect(anionGapCalc({ na: 140, cl: 104, hco3: 24 })).toEqual({ ag: 12, corregido: undefined });
    expect(anionGapCalc({ na: 140, cl: 104, hco3: 24, alb: 2 }).corregido).toBe(17);
  });
  it('anion gap con albúmina 4.0 no corrige', () => {
    expect(anionGapCalc({ na: 140, cl: 104, hco3: 24, alb: 4 }).corregido).toBe(12);
    expect(anionGap.run({ na: 140, cl: 104, hco3: 24 }).ok).toBe(true);
  });
  it('sodio corregido: 130 con glucosa 400 → 134.8 (1.6) y 137.2 (2.4); glucosa 100 no corrige', () => {
    expect(sodioCorregidoCalc({ na: 130, glucosa: 400, factor: 1.6 })).toBeCloseTo(134.8, 9);
    expect(sodioCorregidoCalc({ na: 130, glucosa: 400, factor: 2.4 })).toBeCloseTo(137.2, 9);
    expect(sodioCorregidoCalc({ na: 130, glucosa: 100, factor: 1.6 })).toBe(130);
    expect(sodioCorregido.run({ na: 130, glucosa: 400, factor: 3 }).ok).toBe(false);
  });
  it('calcio corregido: 8.0 con albúmina 2.5 → 9.2; albúmina 4.0 no corrige', () => {
    expect(calcioCorregidoCalc({ ca: 8, alb: 2.5 })).toBeCloseTo(9.2, 9);
    expect(calcioCorregidoCalc({ ca: 9, alb: 4 })).toBe(9);
    expect(calcioCorregido.run({ ca: 8, alb: 2.5 }).ok).toBe(true);
  });
  it('osmolaridad: Na 140, glucosa 90, BUN 14 → 290; brecha con medida 300 → 10', () => {
    expect(osmolaridadCalc({ na: 140, glucosa: 90, bun: 14 }).calculada).toBeCloseTo(290, 9);
    expect(osmolaridadCalc({ na: 140, glucosa: 90, bun: 14, medida: 300 }).brecha).toBeCloseTo(10, 9);
    expect(osmolaridad.run({ na: 140, glucosa: 90 }).ok).toBe(false);
  });
});

describe('Conversión de unidades', () => {
  const c = (conversion: string, valor: number) => { const r = conversionUnidades.run({ conversion, valor }); return r.ok ? r.presentation.value : 'ERR'; };
  it('glucosa 100 mg/dL → 5.55 mmol/L y vuelta 5.55 → 100', () => {
    expect(c('glu-mgdl-mmol', 100)).toBe('5.55');
    expect(c('glu-mmol-mgdl', 5.55)).toBe('100');
  });
  it('creatinina 1 mg/dL → 88 µmol/L; 88.4 µmol/L → 1.00 mg/dL', () => {
    expect(c('cr-mgdl-umol', 1)).toBe('88');
    expect(c('cr-umol-mgdl', 88.4)).toBe('1.00');
  });
  it('colesterol 200 mg/dL → 5.17 mmol/L', () => {
    expect(c('col-mgdl-mmol', 200)).toBe('5.17');
  });
  it('BUN 14 mg/dL → urea 30.0 mg/dL y 5.00 mmol/L', () => {
    expect(c('bun-urea-mgdl', 14)).toBe('30.0');
    expect(c('bun-urea-mmol', 14)).toBe('5.00');
  });
  it('ida y vuelta es consistente y rechaza conversión desconocida', () => {
    const ida = convertir({ conversion: 'glu-mgdl-mmol', valor: 126 }).resultado;
    expect(convertir({ conversion: 'glu-mmol-mgdl', valor: ida }).resultado).toBeCloseTo(126, 9);
    expect(conversionUnidades.run({ conversion: 'nada', valor: 1 }).ok).toBe(false);
  });
});

describe('Balance hídrico', () => {
  it('2000 de ingreso, 1500 de egreso y 500 de insensibles → 0', () => {
    expect(balanceHidrico({ oral: 1000, parenteral: 1000, otrosIngresos: 0, diuresis: 1000, drenajes: 300, otrosEgresos: 200, insensibles: 500 }).balance).toBe(0);
  });
  it('diuresis en mL/kg/h: 840 mL en 12 h con 70 kg = 1.0', () => {
    const o = balanceHidrico({ oral: 0, parenteral: 0, otrosIngresos: 0, diuresis: 840, drenajes: 0, otrosEgresos: 0, horas: 12, peso: 70 });
    expect(o.diuresisMlKgH).toBeCloseTo(1, 9);
    expect(o.balance).toBe(-840);
  });
  it('opcionales vacíos son válidos; negativos y faltantes se rechazan', () => {
    const base = { oral: 100, parenteral: 0, otrosIngresos: 0, diuresis: 50, drenajes: 0, otrosEgresos: 0 };
    const r = balance.run(base);
    expect(r.ok && r.presentation.value).toBe('+50');
    expect(balance.run({ ...base, oral: -1 }).ok).toBe(false);
    expect(balance.run({ ...base, diuresis: undefined }).ok).toBe(false);
  });
});

describe('Peso ideal (Devine)', () => {
  it('hombre 175 cm → 70.5 kg; mujer 160 cm → 52.4 kg', () => {
    expect(devine({ sexo: 'm', talla: 175 }).ideal).toBeCloseTo(70.466, 2);
    expect(devine({ sexo: 'f', talla: 160 }).ideal).toBeCloseTo(52.382, 2);
  });
  it('60 pulgadas exactas → 50 y 45.5', () => {
    expect(devine({ sexo: 'm', talla: 152.4 }).ideal).toBeCloseTo(50, 9);
    expect(devine({ sexo: 'f', talla: 152.4 }).ideal).toBeCloseTo(45.5, 9);
  });
  it('peso ajustado: hombre 175 cm con 100 kg → 82.3; 142 % del ideal', () => {
    const o = devine({ sexo: 'm', talla: 175, peso: 100 });
    expect(o.ajustado).toBeCloseTo(82.28, 1);
    expect(o.porcentajeIdeal).toBeCloseTo(141.9, 0);
  });
  it('rechaza tallas por debajo de 152.4 cm', () => {
    expect(pesoIdeal.run({ sexo: 'f', talla: 150 }).ok).toBe(false);
    expect(pesoIdeal.run({ sexo: 'f', talla: 152.4 }).ok).toBe(true);
  });
});
