import { describe, expect, it } from "vitest";
import { generarPlan } from "@/lib/plataforma/plan";
import { puedeUsar } from "@/lib/plataforma/funciones";
import type { Categoria, PerfilRiesgo, Respuestas } from "@/lib/plataforma/tipos";
import { buscarActivos, OPCIONES_ACTIVO, ratioDe, SIMBOLOS_PERMITIDOS, simboloMercado } from "./activos";
import { tenenciaSchema, type Precios, type Tenencia } from "./tipos";
import {
  compararConPlan,
  costoDe,
  describirDiferencia,
  diasEntre,
  estimarCantidad,
  pesosPorCategoria,
  precioUnitarioUsd,
  resultado,
  valuar,
  valuarTenencia,
} from "./valuar";

const HOY = "2026-11-21";
const MEP = 1000;

const base = {
  cantidadEstimada: false,
  tna: null,
  valorManual: null,
  fecha: "2026-01-01",
  mepAlAnotar: 1000,
  cantidad: null,
  simbolo: null,
} satisfies Partial<Tenencia>;

const cedear = (cantidad: number, invertidoArs = 100_000): Tenencia => ({
  ...base,
  id: "c1",
  tipo: "cedear",
  simbolo: "AAPL",
  nombre: "Apple",
  categoria: "variable",
  invertido: { monto: invertidoArs, moneda: "ARS" },
  cantidad,
});

const precios: Precios = {
  AAPL: { simbolo: "AAPL", precioUsd: 200, variacionDiaPct: 2, actualizado: "2026-11-21T17:00:00Z", fuente: "Yahoo Finance" },
  "BTC-USD": { simbolo: "BTC-USD", precioUsd: 50_000, variacionDiaPct: -4, actualizado: "2026-11-21T17:00:00Z", fuente: "Yahoo Finance" },
};

describe("activos", () => {
  it("la lista de símbolos permitidos no incluye BYMA ni índices", () => {
    for (const s of SIMBOLOS_PERMITIDOS) {
      expect(s).not.toMatch(/\.BA$/);
      expect(s).not.toMatch(/^\^/);
    }
    expect(SIMBOLOS_PERMITIDOS.has("AAPL")).toBe(true);
    expect(SIMBOLOS_PERMITIDOS.has("BTC-USD")).toBe(true);
    expect(SIMBOLOS_PERMITIDOS.has("GGAL")).toBe(false); // acción argentina: sin licencia, va manual
  });

  it("las acciones argentinas y los bonos se anotan con valor manual", () => {
    const ggal = OPCIONES_ACTIVO.find((o) => o.simbolo === "GGAL");
    expect(ggal?.tipo).toBe("manual");
  });

  it("el buscador encuentra por nombre o ticker, sin acentos, y deja 'Otro' al final", () => {
    const r = buscarActivos("apple");
    expect(r[0].simbolo).toBe("AAPL");
    expect(r.at(-1)?.clave).toBe("otro");
    expect(buscarActivos("dolares")[0].tipo).toBe("dolares");
    expect(buscarActivos("zzzz").map((o) => o.clave)).toEqual(["otro"]);
  });

  it("el símbolo de mercado de cripto es el par contra el dólar", () => {
    expect(simboloMercado({ tipo: "cripto", simbolo: "BTC" })).toBe("BTC-USD");
    expect(simboloMercado({ tipo: "manual", simbolo: "GGAL" })).toBeNull();
  });
});

describe("valuación", () => {
  it("un CEDEAR vale el activo original ÷ ratio", () => {
    const ratio = ratioDe("AAPL")!;
    expect(precioUnitarioUsd({ tipo: "cedear", simbolo: "AAPL" }, precios)).toBeCloseTo(200 / ratio);
    const v = valuarTenencia(cedear(10), precios, MEP, HOY);
    expect(v.valorUsd).toBeCloseTo((200 / ratio) * 10);
    expect(v.valorArs).toBeCloseTo((200 / ratio) * 10 * MEP);
    expect(v.metodo).toBe("estimado-subyacente");
  });

  it("estima la cantidad con lo que puso y el precio del día", () => {
    const unitario = precioUnitarioUsd({ tipo: "cedear", simbolo: "AAPL" }, precios)!;
    const costo = costoDe(cedear(1)).usd; // 100.000 ARS / 1000 = 100 USD
    expect(costo).toBe(100);
    const cant = estimarCantidad(costo, unitario);
    const v = valuarTenencia(cedear(cant), precios, MEP, HOY);
    expect(v.valorUsd).toBeCloseTo(100); // recién anotado: vale lo que puso
  });

  it("la variación del día sale del porcentaje del día", () => {
    const btc: Tenencia = { ...base, id: "b", tipo: "cripto", simbolo: "BTC", nombre: "Bitcoin", categoria: "alternativo", invertido: { monto: 500, moneda: "USD" }, cantidad: 0.01 };
    const v = valuarTenencia(btc, precios, MEP, HOY);
    expect(v.valorUsd).toBeCloseTo(500);
    expect(v.variacionDiaUsd).toBeCloseTo(500 - 500 / 0.96);
  });

  it("lo invertido hoy no suma variación del día", () => {
    const v = valuarTenencia({ ...cedear(10), fecha: HOY }, precios, MEP, HOY);
    expect(v.variacionDiaUsd).toBe(0);
  });

  it("sin precio, la tenencia queda sin valor y la valuación avisa que está incompleta", () => {
    const v = valuar([cedear(10)], {}, MEP, HOY);
    expect(v.tenencias[0].valorUsd).toBeNull();
    expect(v.incompleta).toBe(true);
    expect(v.totalUsd).toBe(0);
    expect(v.costoUsd).toBe(0); // no se compara el costo de lo que no tiene valor
  });

  it("plazo fijo: interés simple con la tasa cargada", () => {
    const pf: Tenencia = { ...base, id: "p", tipo: "plazo-fijo", nombre: "Plazo fijo", categoria: "fija", invertido: { monto: 365_000, moneda: "ARS" }, tna: 0.3, fecha: "2026-11-11" };
    const v = valuarTenencia(pf, {}, MEP, HOY);
    expect(diasEntre("2026-11-11", HOY)).toBe(10);
    expect(v.valorArs).toBeCloseTo(365_000 + 3_000);
    expect(v.metodo).toBe("calculado");
  });

  it("lo manual vale lo que cargó la persona", () => {
    const m: Tenencia = {
      ...base,
      id: "m",
      tipo: "manual",
      simbolo: "GGAL",
      nombre: "Galicia",
      categoria: "variable",
      invertido: { monto: 100_000, moneda: "ARS" },
      valorManual: { monto: 120_000, moneda: "ARS", fecha: "2026-11-20" },
    };
    const v = valuarTenencia(m, {}, MEP, HOY);
    expect(v.valorArs).toBe(120_000);
    expect(v.actualizado).toBe("2026-11-20");
    expect(resultado(valuar([m], {}, MEP, HOY), "ARS")).toEqual({ monto: 20_000, pct: 20 });
  });

  it("los dólares comprados con pesos se pasan con el dólar del día en que se anotaron", () => {
    const d: Tenencia = { ...base, id: "d", tipo: "dolares", nombre: "Dólares", categoria: "liquidez", invertido: { monto: 200_000, moneda: "ARS" }, mepAlAnotar: 1000 };
    const v = valuarTenencia(d, {}, 1250, HOY);
    expect(v.valorUsd).toBe(200);
    expect(v.valorArs).toBe(250_000); // en pesos subió porque subió el dólar
  });
});

describe("pesos por categoría", () => {
  it("suman 100 con enteros", () => {
    const p = pesosPorCategoria({ fija: 1, variable: 1, dividendos: 1, liquidez: 0, alternativo: 0 });
    expect(Object.values(p).reduce((a, b) => a + b, 0)).toBe(100);
  });
  it("sin nada, todo en cero", () => {
    expect(Object.values(pesosPorCategoria({ fija: 0, variable: 0, dividendos: 0, liquidez: 0, alternativo: 0 }))).toEqual([0, 0, 0, 0, 0]);
  });
});

describe("comparación con el plan", () => {
  const respuestas: Respuestas = {
    edad: 25,
    objetivo: "Crecimiento",
    horizonte: "5-10",
    capitalInicial: 1000,
    aporteMensual: 100,
    fondoEmergencia: "si",
    deudasCaras: false,
    reaccionCaida: "espero",
    prioridad: "equilibrio",
    conocimiento: "basico",
  };

  it("ordena por la diferencia más grande", () => {
    const plan = generarPlan(respuestas, "2026-11-01T00:00:00.000Z");
    const distribucion = Object.fromEntries(plan.posiciones.map((p) => [p.categoria, p.porcentaje])) as Record<Categoria, number>;
    for (const c of ["fija", "variable", "dividendos", "liquidez", "alternativo"] as Categoria[]) distribucion[c] ??= 0;
    const d = compararConPlan({ fija: 0, variable: 100, dividendos: 0, liquidez: 0, alternativo: 0 }, distribucion);
    expect(Math.abs(d[0].diferencia)).toBeGreaterThanOrEqual(Math.abs(d.at(-1)!.diferencia));
  });

  it("los textos describen y nunca dicen qué hacer", () => {
    // Imperativos y recomendaciones ("vendé", "comprá"); "sin vender nada" describe, no ordena.
    const prohibido = /compr[aá](?![a-zñ])|vend[eé](?![a-zñ])|rebalance|te recomendamos|deber[ií]as|ten[eé]s que/i;
    const perfiles: PerfilRiesgo[] = ["Conservador", "Moderado", "Agresivo"];
    for (const perfil of perfiles)
      for (const categoria of ["fija", "variable", "dividendos", "liquidez", "alternativo"] as Categoria[])
        for (const diferencia of [-30, 0, 30]) {
          const texto = describirDiferencia({ categoria, planPct: 30, tuyoPct: 30 + diferencia, diferencia }, perfil);
          expect(texto).not.toMatch(prohibido);
        }
  });
});

describe("schema y funciones Plus", () => {
  it("rechaza un CEDEAR sin cantidad", () => {
    expect(tenenciaSchema.safeParse({ ...cedear(1), cantidad: null }).success).toBe(false);
    expect(tenenciaSchema.safeParse(cedear(1)).success).toBe(true);
  });

  it("en vista previa todo está abierto; sin vista previa, Plus pide plan Plus", () => {
    expect(puedeUsar("cartera-real", "free", true)).toBe(true);
    expect(puedeUsar("cartera-real", "free", false)).toBe(false);
    expect(puedeUsar("cartera-real", "plus", false)).toBe(true);
  });
});
