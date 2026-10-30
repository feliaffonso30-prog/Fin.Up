import { describe, expect, it } from "vitest";
import {
  inflacionDeEquilibrioUva,
  inflacionDelPeriodo,
  interesCompuesto,
  interesSimple,
  rendimientoUva,
  tasaReal,
  teaATem,
  teaATna,
  tnaATea,
  tnaATem,
  validarMonto,
} from "./finanzas";

describe("conversión de tasas", () => {
  it("TNA → TEM: 36,5% anual son 3% cada 30 días", () => {
    expect(tnaATem(0.365)).toBeCloseTo(0.03, 10);
  });

  it("TNA → TEA reinvirtiendo cada 30 días", () => {
    // 1,03 ^ (365/30) − 1
    expect(tnaATea(0.365)).toBeCloseTo(0.4328, 4);
    // Un plazo fijo real: 22% TNA ≈ 24,36% TEA
    expect(tnaATea(0.22)).toBeCloseTo(0.2436, 4);
  });

  it("capitalizar a diario da más TEA que a 30 días", () => {
    expect(tnaATea(0.2, 1)).toBeGreaterThan(tnaATea(0.2, 30));
  });

  it("TEA → TNA es la inversa de TNA → TEA", () => {
    for (const tna of [0.01, 0.2, 0.35, 1.2]) {
      expect(teaATna(tnaATea(tna))).toBeCloseTo(tna, 10);
      expect(teaATna(tnaATea(tna, 1), 1)).toBeCloseTo(tna, 10);
    }
  });

  it("la TEM sale igual desde la TNA o desde la TEA", () => {
    expect(teaATem(tnaATea(0.22))).toBeCloseTo(tnaATem(0.22), 10);
  });
});

describe("intereses", () => {
  it("plazo fijo: $1.000.000 al 36,5% por 30 días ganan $30.000", () => {
    expect(interesSimple(1_000_000, 0.365, 30)).toBeCloseTo(30_000, 6);
  });

  it("interés simple crece lineal con el plazo", () => {
    expect(interesSimple(1000, 0.2, 90)).toBeCloseTo(3 * interesSimple(1000, 0.2, 30), 10);
  });

  it("compuesto: en un año da exactamente la TEA", () => {
    expect(interesCompuesto(1000, 0.21, 365)).toBeCloseTo(210, 8);
  });

  it("con monto 0 la ganancia es 0", () => {
    expect(interesSimple(0, 0.3, 30)).toBe(0);
    expect(interesCompuesto(0, 0.3, 30)).toBe(0);
  });
});

describe("inflación y tasa real", () => {
  it("2% mensual durante 60 días acumula 4,04%", () => {
    expect(inflacionDelPeriodo(0.02, 60)).toBeCloseTo(0.0404, 10);
  });

  it("UVA: ajuste por inflación más la TNA", () => {
    // 1,02^6 × (1 + 1% × 180/365) − 1
    expect(rendimientoUva(0.01, 0.02, 180)).toBeCloseTo(0.131716, 5);
    // Con TNA 0 rinde exactamente la inflación
    expect(rendimientoUva(0, 0.02, 60)).toBeCloseTo(inflacionDelPeriodo(0.02, 60), 10);
  });

  it("inflación de equilibrio UVA vs. tradicional", () => {
    const i = inflacionDeEquilibrioUva(0.25, 0.01, 180);
    // Con esa inflación, los dos rinden exactamente lo mismo
    expect(rendimientoUva(0.01, i, 180)).toBeCloseTo(interesSimple(1, 0.25, 180), 10);
    // Más inflación → gana el UVA; menos → gana el tradicional
    expect(rendimientoUva(0.01, i + 0.001, 180)).toBeGreaterThan(interesSimple(1, 0.25, 180));
    expect(rendimientoUva(0.01, i - 0.001, 180)).toBeLessThan(interesSimple(1, 0.25, 180));
    expect(i).toBeCloseTo(0.01873, 5); // ~1,87% mensual
  });

  it("tasa real: positiva si le gana, negativa si pierde, 0 si empata", () => {
    expect(tasaReal(0.02, 0.02)).toBeCloseTo(0, 12);
    expect(tasaReal(0.025, 0.02)).toBeGreaterThan(0);
    expect(tasaReal(0.0159, 0.017)).toBeLessThan(0);
    // No es una resta: (1,03 / 1,02) − 1
    expect(tasaReal(0.03, 0.02)).toBeCloseTo(0.0098039, 6);
  });
});

describe("validarMonto", () => {
  it("acepta formatos argentinos", () => {
    expect(validarMonto("1.500.000")).toEqual({ ok: true, monto: 1_500_000 });
    expect(validarMonto("$ 2.000")).toEqual({ ok: true, monto: 2000 });
    expect(validarMonto("1500000,50")).toEqual({ ok: true, monto: 1_500_000.5 });
    expect(validarMonto("250000")).toEqual({ ok: true, monto: 250_000 });
    expect(validarMonto(300_000)).toEqual({ ok: true, monto: 300_000 });
  });

  it("rechaza vacío, cero, negativos y basura", () => {
    for (const malo of ["", "   ", "0", "-5000", "abc", "1.50.000", "1e9", null, undefined, 0, -1, Number.NaN, Infinity]) {
      expect(validarMonto(malo as string | number | null | undefined).ok).toBe(false);
    }
  });

  it("explica el error en lenguaje simple", () => {
    expect(validarMonto("-100")).toEqual({ ok: false, error: "El monto tiene que ser mayor a cero." });
    expect(validarMonto("")).toEqual({ ok: false, error: "Ingresá un monto." });
  });

  it("rechaza montos absurdos", () => {
    expect(validarMonto(1e13).ok).toBe(false);
  });
});
