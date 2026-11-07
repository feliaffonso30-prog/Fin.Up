import { describe, expect, it } from "vitest";
import { calcularEscenarios, ejemploDePortada, pesosADolares } from "./escenarios";
import { montoConSigno, pctConSigno, rangoConSigno } from "./formato";

const analisis = { retornoMin: 2.9, retornoMax: 6.9, caida: -12, nivelRiesgo: "Medio" as const };

describe("calcularEscenarios", () => {
  it("calcula lo bueno y lo malo sobre el mismo capital", () => {
    const e = calcularEscenarios(1000, analisis);
    expect(e.ganaMin).toBeCloseTo(29);
    expect(e.ganaMax).toBeCloseTo(69);
    expect(e.pierde).toBeCloseTo(-120);
    expect(e.queda).toBeCloseTo(880);
  });
  it("sin capital todo da cero", () => {
    expect(calcularEscenarios(0, analisis).queda).toBe(0);
  });
});

describe("ejemploDePortada", () => {
  it("usa el motor real y muestra una pérdida posible", () => {
    const { capital, analisis: a } = ejemploDePortada();
    expect(capital).toBe(1000);
    expect(a.retornoMin).toBeLessThanOrEqual(a.retornoMax);
    expect(a.caida).toBeLessThan(0);
  });
});

describe("pesosADolares", () => {
  it("redondea a dólares enteros", () => {
    expect(pesosADolares(315000, 1574)).toBe(200);
    expect(pesosADolares(0, 1574)).toBe(0);
  });
});

describe("cifras con signo", () => {
  it("una pérdida lleva el signo menos real", () => {
    expect(montoConSigno(-121)).toBe("−USD 121");
    expect(montoConSigno(-121, false)).toBe("−121");
    expect(pctConSigno(-12, 0)).toBe("−12%");
  });
  it("un rango positivo lleva un solo signo", () => {
    expect(rangoConSigno(29, 69)).toBe("+USD 29 a 69");
    expect(rangoConSigno(29, 69, false)).toBe("+29 a 69");
  });
  it("un rango que cruza el cero aclara los dos signos", () => {
    expect(rangoConSigno(-5, 30, false)).toBe("−5 a +30");
  });
});
