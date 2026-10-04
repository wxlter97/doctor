import { describe, expect, it } from 'vitest';
import { apgar, cha2ds2vasc, gcsInterpret, glasgow, glasgowPediatrico } from './escalas';

describe('Glasgow', () => {
  it('máximo 15 y mínimo 3', () => {
    const max = glasgow.run({ ocular: 4, verbal: 5, motora: 6 });
    const min = glasgow.run({ ocular: 1, verbal: 1, motora: 1 });
    expect(max.ok && max.output).toBe(15);
    expect(min.ok && min.output).toBe(3);
  });
  it('E3 V4 M5 = 12 moderado', () => {
    const r = glasgow.run({ ocular: 3, verbal: 4, motora: 5 });
    expect(r.ok && r.output).toBe(12);
    expect(r.ok && r.interpretation?.severity).toBe('warning');
  });
  it('bordes de gravedad', () => {
    expect(gcsInterpret(13).severity).toBe('info');
    expect(gcsInterpret(12).severity).toBe('warning');
    expect(gcsInterpret(9).severity).toBe('warning');
    expect(gcsInterpret(8).severity).toBe('danger');
  });
  it('rechaza valores fuera de las opciones o faltantes', () => {
    expect(glasgow.run({ ocular: 5, verbal: 5, motora: 6 })).toMatchObject({ ok: false, errors: { ocular: 'Elegí una opción.' } });
    expect(glasgow.run({ ocular: 4, motora: 6 }).ok).toBe(false);
    expect(glasgow.run({ ocular: 4, verbal: 5, motora: 7 }).ok).toBe(false);
  });
  it('pediátrica comparte rango 3–15', () => {
    const r = glasgowPediatrico.run({ ocular: 4, verbal: 5, motora: 6 });
    expect(r.ok && r.output).toBe(15);
  });
});

describe('APGAR', () => {
  it('10, 7 y 3 en los bordes de interpretación', () => {
    const run = (n: number[]) => apgar.run({ fc: n[0], resp: n[1], tono: n[2], reflejos: n[3], color: n[4] });
    const a = run([2, 2, 2, 2, 2]);
    expect(a.ok && a.output).toBe(10);
    const b = run([2, 2, 1, 1, 1]);
    expect(b.ok && b.output).toBe(7);
    expect(b.ok && b.interpretation?.severity).toBe('info');
    const c = run([1, 1, 1, 1, 1]);
    expect(c.ok && c.interpretation?.severity).toBe('warning');
    const d = run([1, 1, 1, 0, 0]);
    expect(d.ok && d.output).toBe(3);
    expect(d.ok && d.interpretation?.severity).toBe('danger');
  });
  it('rechaza puntajes inválidos', () => {
    expect(apgar.run({ fc: 3, resp: 2, tono: 2, reflejos: 2, color: 2 }).ok).toBe(false);
    expect(apgar.run({ fc: 2 }).ok).toBe(false);
  });
});

describe('CHA₂DS₂-VASc', () => {
  const base = { ic: 0, hta: 0, edad: 0, dm: 0, acv: 0, vascular: 0, sexo: 0 };
  it('0 y 9 en los extremos', () => {
    const lo = cha2ds2vasc.run(base);
    expect(lo.ok && lo.output).toBe(0);
    const hi = cha2ds2vasc.run({ ic: 1, hta: 1, edad: 2, dm: 1, acv: 2, vascular: 1, sexo: 1 });
    expect(hi.ok && hi.output).toBe(9);
  });
  it('mujer de 70 años con HTA = 3 (alto)', () => {
    const r = cha2ds2vasc.run({ ...base, sexo: 1, edad: 1, hta: 1 });
    expect(r.ok && r.output).toBe(3);
    expect(r.ok && r.interpretation?.severity).toBe('danger');
  });
  it('1 punto = intermedio', () => {
    const r = cha2ds2vasc.run({ ...base, dm: 1 });
    expect(r.ok && r.interpretation?.label).toContain('intermedio');
  });
  it('ACV vale 2 y no acepta 1', () => {
    expect(cha2ds2vasc.run({ ...base, acv: 2 }).ok).toBe(true);
    expect(cha2ds2vasc.run({ ...base, acv: 1 }).ok).toBe(false);
  });
});
