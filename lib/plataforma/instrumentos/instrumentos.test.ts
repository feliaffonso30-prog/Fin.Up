import { describe, expect, it } from "vitest";
import type { PerfilRiesgo } from "../tipos";
import { CATALOGO_INSTRUMENTOS, CATEGORIAS_CON_EJEMPLOS, cargarInstrumentos, ejemplosPara, filtrar, porTicker } from "./catalogo";
import { INSTRUMENTOS } from "./datos";
import { TERMINOS } from "./glosario";

const PERFILES: PerfilRiesgo[] = ["Conservador", "Moderado", "Agresivo"];

describe("datos de la biblioteca", () => {
  it("todos los instrumentos pasan la validación", () => {
    const { errores } = cargarInstrumentos(INSTRUMENTOS);
    expect(errores).toEqual([]);
    expect(CATALOGO_INSTRUMENTOS.length).toBe(INSTRUMENTOS.length);
  });

  it("tiene entre 15 y 25 instrumentos", () => {
    expect(INSTRUMENTOS.length).toBeGreaterThanOrEqual(15);
    expect(INSTRUMENTOS.length).toBeLessThanOrEqual(25);
  });

  it("ningún texto suena a recomendación de compra", () => {
    const prohibidas = [/te recomendamos/i, /recomendamos/i, /comprá/i, /compral[oa]/i, /invert[ií] en/i, /para vos lo mejor/i, /te conviene/i, /deber[ií]as comprar/i, /garantizad[oa]s? (que|una|un) /i];
    for (const i of INSTRUMENTOS) {
      const textos = [i.descripcion, i.porQueEnLaLista, ...i.riesgos].join(" ");
      for (const p of prohibidas) expect(textos, `${i.ticker} usa ${p}`).not.toMatch(p);
    }
  });

  it("riesgo alto nunca es ejemplo para el perfil conservador", () => {
    for (const i of CATALOGO_INSTRUMENTOS) {
      if (i.riesgo === "alto") expect(i.perfilesEjemplo, i.ticker).not.toContain("Conservador");
    }
  });
});

describe("validación tolerante", () => {
  it("descarta el instrumento roto y conserva el resto", () => {
    const roto = { ...INSTRUMENTOS[0], ticker: "mal ticker" };
    const sinRatio = { ...INSTRUMENTOS[0], ticker: "XYZ", ratio: null };
    const { instrumentos, errores } = cargarInstrumentos([roto, sinRatio, INSTRUMENTOS[1], null]);
    expect(instrumentos.map((i) => i.ticker)).toEqual([INSTRUMENTOS[1].ticker]);
    expect(errores).toHaveLength(3);
  });

  it("descarta tickers repetidos", () => {
    const { instrumentos, errores } = cargarInstrumentos([INSTRUMENTOS[0], INSTRUMENTOS[0]]);
    expect(instrumentos).toHaveLength(1);
    expect(errores[0]).toMatch(/repetido/);
  });
});

describe("búsqueda y filtros", () => {
  it("encuentra por ticker sin importar mayúsculas", () => {
    expect(porTicker("spy")?.ticker).toBe("SPY");
    expect(porTicker("NO-EXISTE")).toBeNull();
    expect(porTicker("%E0%A4%A")).toBeNull(); // URL mal formada no rompe
  });

  it("busca por nombre o sector sin tildes", () => {
    expect(filtrar(CATALOGO_INSTRUMENTOS, { texto: "energia" }).map((i) => i.ticker)).toContain("PAMP");
    expect(filtrar(CATALOGO_INSTRUMENTOS, { texto: "coca" }).map((i) => i.ticker)).toEqual(["KO"]);
  });

  it("combina filtros y puede quedar vacío", () => {
    const r = filtrar(CATALOGO_INSTRUMENTOS, { categoria: "accion-ar", riesgo: "alto" });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((i) => i.categoria === "accion-ar" && i.riesgo === "alto")).toBe(true);
    expect(filtrar(CATALOGO_INSTRUMENTOS, { categoria: "accion-ar", riesgo: "bajo" })).toEqual([]);
  });

  it("'todas' / 'todos' no filtra", () => {
    expect(filtrar(CATALOGO_INSTRUMENTOS, { categoria: "todas", riesgo: "todos", moneda: "todas" })).toHaveLength(CATALOGO_INSTRUMENTOS.length);
  });
});

describe("ejemplos para la cartera", () => {
  it("hay entre 3 y 5 ejemplos para cada categoría y perfil", () => {
    for (const perfil of PERFILES) {
      for (const cat of CATEGORIAS_CON_EJEMPLOS) {
        const ej = ejemplosPara(cat, perfil);
        expect(ej.length, `${cat} / ${perfil}`).toBeGreaterThanOrEqual(3);
        expect(ej.length).toBeLessThanOrEqual(5);
        expect(ej.every((i) => i.perfilesEjemplo.includes(perfil) && i.categoriasCartera.includes(cat))).toBe(true);
      }
    }
  });

  it("el perfil conservador nunca ve instrumentos de riesgo alto", () => {
    for (const cat of CATEGORIAS_CON_EJEMPLOS) {
      expect(ejemplosPara(cat, "Conservador").some((i) => i.riesgo === "alto")).toBe(false);
    }
  });

  it("acciones y ETFs muestran variedad de tipos", () => {
    const tipos = new Set(ejemplosPara("variable", "Moderado").map((i) => i.categoria));
    expect(tipos.size).toBeGreaterThanOrEqual(2);
  });

  it("liquidez y alternativos no tienen ejemplos (van al comparador o quedan para más adelante)", () => {
    expect(ejemplosPara("liquidez", "Moderado")).toEqual([]);
    expect(ejemplosPara("alternativo", "Agresivo")).toEqual([]);
  });
});

describe("glosario", () => {
  it("cubre los términos pedidos", () => {
    for (const k of ["cedear", "ratio", "liquidez", "volatilidad"] as const) expect(TERMINOS[k].definicion.length).toBeGreaterThan(20);
  });
});

describe("pregunta para FinBot", () => {
  it("pide una explicación con el ticker, sin pedir recomendación", async () => {
    const { preguntaFinBot } = await import("./textos");
    const q = preguntaFinBot(INSTRUMENTOS[0]);
    expect(q).toContain(INSTRUMENTOS[0].ticker);
    expect(q).not.toMatch(/conviene|recomend|compr/i);
  });
});

describe("ejemplos según el riesgo del perfil", () => {
  it("el agresivo ve primero riesgo alto y el moderado riesgo medio", () => {
    expect(ejemplosPara("variable", "Agresivo")[0].riesgo).toBe("alto");
    expect(ejemplosPara("variable", "Moderado")[0].riesgo).toBe("medio");
    expect(ejemplosPara("fija", "Conservador")[0].riesgo).toBe("bajo");
  });
});
