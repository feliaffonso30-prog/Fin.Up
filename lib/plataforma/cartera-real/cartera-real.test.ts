import { describe, expect, it } from "vitest";
import { generarPlan } from "@/lib/plataforma/plan";
import { puedeUsar } from "@/lib/plataforma/funciones";
import type { Categoria, PerfilRiesgo, Respuestas } from "@/lib/plataforma/tipos";
import { CATALOGO_INSTRUMENTOS } from "@/lib/plataforma/instrumentos/catalogo";
import { buscarActivos, divisorPrecio, MAX_RESULTADOS, OPCIONES_ACTIVO, PRECIOS_BYMA_ACTIVOS, ratioDe, SIMBOLOS_PERMITIDOS, simboloByma, simboloMercado, simbolosPrecio } from "./activos";
import { CEDEARS } from "./cedears";
import { cierreEnFecha, type Cierre } from "./historico";
import { tenenciaSchema, type Precios, type Tenencia } from "./tipos";
import {
  compararConPlan,
  costoDe,
  costoDesdeCantidad,
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
  costoEstimado: false,
  costoDesdeCierre: false,
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
  AAPL: { simbolo: "AAPL", precio: 200, moneda: "USD", variacionDiaPct: 2, actualizado: "2026-11-21T17:00:00Z", fuente: "Yahoo Finance" },
  "BTC-USD": { simbolo: "BTC-USD", precio: 50_000, moneda: "USD", variacionDiaPct: -4, actualizado: "2026-11-21T17:00:00Z", fuente: "Yahoo Finance" },
};

describe("activos", () => {
  it("la lista de símbolos permitidos no incluye índices ni símbolos .BA de Yahoo", () => {
    for (const s of SIMBOLOS_PERMITIDOS) {
      expect(s).not.toMatch(/\.BA$/);
      expect(s).not.toMatch(/^\^/);
      if (!PRECIOS_BYMA_ACTIVOS) expect(s).not.toMatch(/^BYMA:/);
    }
    expect(SIMBOLOS_PERMITIDOS.has("AAPL")).toBe(true);
    expect(SIMBOLOS_PERMITIDOS.has("BTC-USD")).toBe(true);
    expect(SIMBOLOS_PERMITIDOS.has("GGAL")).toBe(false); // lo de BYMA va siempre con prefijo
    expect(SIMBOLOS_PERMITIDOS.has("BYMA:GGAL")).toBe(PRECIOS_BYMA_ACTIVOS);
  });

  it("las acciones argentinas y los bonos usan el precio de BYMA (o valor manual si está apagado)", () => {
    const ggal = OPCIONES_ACTIVO.find((o) => o.simbolo === "GGAL");
    const al30 = OPCIONES_ACTIVO.find((o) => o.simbolo === "AL30");
    expect(ggal?.tipo).toBe(PRECIOS_BYMA_ACTIVOS ? "byma" : "manual");
    expect(al30?.tipo).toBe(PRECIOS_BYMA_ACTIVOS ? "byma" : "manual");
    expect(al30?.unidad).toBe(PRECIOS_BYMA_ACTIVOS ? "nominales" : undefined);
  });

  it("un CEDEAR pide primero el precio de BYMA y después el del activo original", () => {
    expect(simbolosPrecio({ tipo: "cedear", simbolo: "AAPL" })).toEqual(PRECIOS_BYMA_ACTIVOS ? ["BYMA:AAPL", "AAPL"] : ["AAPL"]);
    expect(simboloByma({ tipo: "cripto", simbolo: "BTC" })).toBeNull();
    expect(simboloByma({ tipo: "manual", simbolo: "GGAL" })).toBeNull(); // lo anotado a mano sigue a mano
  });

  it("los bonos cotizan cada 100 nominales", () => {
    expect(divisorPrecio("AL30")).toBe(100);
    expect(divisorPrecio("GGAL")).toBe(1);
    expect(divisorPrecio("AAPL")).toBe(1);
  });

  it("el buscador encuentra por nombre o ticker, sin acentos, y deja 'Otro' al final", () => {
    const r = buscarActivos("apple");
    expect(r[0].simbolo).toBe("AAPL");
    expect(r.at(-1)?.clave).toBe("otro");
    expect(buscarActivos("dolares")[0].tipo).toBe("dolares");
    expect(buscarActivos("zzzz").map((o) => o.clave)).toEqual(["otro"]);
  });

  it("están todos los CEDEARs de BYMA, sin códigos repetidos y con ratio válido", () => {
    expect(CEDEARS.length).toBeGreaterThan(400);
    expect(new Set(CEDEARS.map((c) => c.byma)).size).toBe(CEDEARS.length);
    for (const c of CEDEARS) {
      expect(c.ratio).toBeGreaterThan(0);
      if (c.subyacente) expect(c.subyacente).not.toMatch(/\.BA$|^\^/);
    }
  });

  it("los CEDEARs de la Biblioteca tienen el mismo ratio que el listado de BYMA", () => {
    for (const i of CATALOGO_INSTRUMENTOS.filter((x) => x.ratio !== null)) {
      expect(ratioDe(i.ticker), i.ticker).toBe(i.ratio);
    }
    expect(ratioDe("SPY")).toBe(60);
  });

  it("cuando el código de BYMA es distinto, usa el ticker de EE.UU. del activo original", () => {
    expect(simboloMercado({ tipo: "cedear", simbolo: "DISN" })).toBe("DIS");
    expect(simboloMercado({ tipo: "cedear", simbolo: "BRKB" })).toBe("BRK-B");
    expect(SIMBOLOS_PERMITIDOS.has("DIS")).toBe(true);
  });

  it("encuentra cualquier CEDEAR, acción argentina o bono por nombre o código", () => {
    expect(buscarActivos("disney")[0].simbolo).toBe("DISN");
    expect(buscarActivos("DISN")[0].simbolo).toBe("DISN");
    expect(buscarActivos("ggal")[0].simbolo).toBe("GGAL");
    expect(buscarActivos("al30")[0].simbolo).toBe("AL30");
    expect(buscarActivos("a").length).toBeLessThanOrEqual(MAX_RESULTADOS + 1);
  });

  it("un CEDEAR cuyo activo original no cotiza en EE.UU. solo tiene el precio de BYMA", () => {
    const petrobras = OPCIONES_ACTIVO.find((o) => o.simbolo === "PETR3");
    expect(petrobras?.tipo).toBe(PRECIOS_BYMA_ACTIVOS ? "byma" : "manual");
  });

  it("el símbolo de mercado de cripto es el par contra el dólar", () => {
    expect(simboloMercado({ tipo: "cripto", simbolo: "BTC" })).toBe("BTC-USD");
    expect(simboloMercado({ tipo: "manual", simbolo: "GGAL" })).toBeNull();
  });
});

describe("valuación", () => {
  const conByma: Precios = {
    ...precios,
    "BYMA:AAPL": { simbolo: "BYMA:AAPL", precio: 11_000, moneda: "ARS", variacionDiaPct: 1, actualizado: "2026-11-21T17:00:00Z", fuente: "BYMA" },
    "BYMA:GGAL": { simbolo: "BYMA:GGAL", precio: 5_000, moneda: "ARS", variacionDiaPct: -2, actualizado: "2026-11-21T17:00:00Z", fuente: "BYMA" },
    "BYMA:AL30": { simbolo: "BYMA:AL30", precio: 80_000, moneda: "ARS", variacionDiaPct: 0.5, actualizado: "2026-11-21T17:00:00Z", fuente: "BYMA" },
  };
  const deByma = (simbolo: string, cantidad: number): Tenencia => ({ ...cedear(cantidad), id: simbolo, tipo: "byma", simbolo, nombre: simbolo });

  it.runIf(PRECIOS_BYMA_ACTIVOS)("con precio de BYMA, un CEDEAR usa ese precio y no la estimación", () => {
    const v = valuarTenencia(cedear(10), conByma, MEP, HOY);
    expect(v.valorArs).toBeCloseTo(110_000);
    expect(v.metodo).toBe("mercado");
    expect(v.fuente).toContain("BYMA");
  });

  it.runIf(PRECIOS_BYMA_ACTIVOS)("una acción argentina vale cantidad × precio de BYMA, en pesos", () => {
    const v = valuarTenencia(deByma("GGAL", 50), conByma, MEP, HOY);
    expect(v.valorArs).toBeCloseTo(250_000);
    expect(v.valorUsd).toBeCloseTo(250_000 / MEP);
    expect(v.variacionDiaUsd).toBeCloseTo(250_000 / MEP - 250_000 / MEP / 0.98);
  });

  it.runIf(PRECIOS_BYMA_ACTIVOS)("un bono vale nominales × precio ÷ 100", () => {
    const v = valuarTenencia(deByma("AL30", 1000), conByma, MEP, HOY);
    expect(v.valorArs).toBeCloseTo(800_000);
    expect(precioUnitarioUsd({ tipo: "byma", simbolo: "AL30" }, conByma, MEP)).toBeCloseTo(800 / MEP);
  });

  it("sin precio de BYMA, lo de BYMA queda sin valor (y la cartera, incompleta)", () => {
    const v = valuar([deByma("GGAL", 50)], precios, MEP, HOY);
    expect(v.tenencias[0].valorUsd).toBeNull();
    expect(v.incompleta).toBe(true);
  });

  it("un CEDEAR vale el activo original ÷ ratio", () => {
    const ratio = ratioDe("AAPL")!;
    expect(precioUnitarioUsd({ tipo: "cedear", simbolo: "AAPL" }, precios, MEP)).toBeCloseTo(200 / ratio);
    const v = valuarTenencia(cedear(10), precios, MEP, HOY);
    expect(v.valorUsd).toBeCloseTo((200 / ratio) * 10);
    expect(v.valorArs).toBeCloseTo((200 / ratio) * 10 * MEP);
    expect(v.metodo).toBe("estimado-subyacente");
  });

  it("estima la cantidad con lo que puso y el precio del día", () => {
    const unitario = precioUnitarioUsd({ tipo: "cedear", simbolo: "AAPL" }, precios, MEP)!;
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

  it("por cantidad: lo que puso es cantidad × precio de compra", () => {
    expect(costoDesdeCantidad(10, { monto: 15_000, moneda: "ARS" }, null)).toEqual({ invertido: { monto: 150_000, moneda: "ARS" }, estimado: false });
  });

  it("por cantidad sin precio de compra: arranca desde el precio de hoy y queda marcado como estimado", () => {
    const unitario = precioUnitarioUsd({ tipo: "cedear", simbolo: "AAPL" }, precios, MEP)!;
    const c = costoDesdeCantidad(10, null, { monto: unitario, moneda: "USD" })!;
    expect(c.estimado).toBe(true);
    const t: Tenencia = { ...cedear(10), invertido: c.invertido, costoEstimado: true, fecha: HOY };
    const v = valuar([t], precios, MEP, HOY);
    expect(resultado(v, "USD").monto).toBeCloseTo(0); // recién anotado: ni gana ni pierde
  });

  it("por cantidad sin ningún precio no se puede calcular", () => {
    expect(costoDesdeCantidad(10, null, null)).toBeNull();
    expect(costoDesdeCantidad(0, { monto: 1, moneda: "ARS" }, null)).toBeNull();
  });

  it("lo guardado antes de existir costoEstimado se sigue leyendo", () => {
    const { costoEstimado: _, ...viejo } = cedear(1);
    const r = tenenciaSchema.safeParse(viejo);
    expect(r.success && r.data.costoEstimado).toBe(false);
  });

  it("las acciones, los CEDEARs y la cripto se pueden anotar por cantidad; los bonos, solo con precio de BYMA", () => {
    expect(OPCIONES_ACTIVO.find((o) => o.simbolo === "GGAL")?.unidad).toBe("acciones");
    expect(OPCIONES_ACTIVO.find((o) => o.simbolo === "AAPL")?.unidad).toBe("CEDEARs");
    expect(OPCIONES_ACTIVO.find((o) => o.simbolo === "BTC")?.unidad).toBe("BTC");
    expect(OPCIONES_ACTIVO.find((o) => o.simbolo === "AL30")?.unidad).toBe(PRECIOS_BYMA_ACTIVOS ? "nominales" : undefined);
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

describe("precio del día en que compró", () => {
  const serie: Cierre[] = [
    { fecha: "2026-03-04", cierre: 100 },
    { fecha: "2026-03-05", cierre: 102 },
    { fecha: "2026-03-06", cierre: 105 },
    { fecha: "2026-03-09", cierre: 110 },
  ];

  it("usa el cierre de ese día", () => {
    expect(cierreEnFecha(serie, "2026-03-05")).toEqual({ fecha: "2026-03-05", cierre: 102 });
  });

  it("si ese día no hubo mercado, usa el último día hábil anterior", () => {
    expect(cierreEnFecha(serie, "2026-03-07")).toEqual({ fecha: "2026-03-06", cierre: 105 }); // sábado
    expect(cierreEnFecha(serie, "2026-03-08")?.fecha).toBe("2026-03-06"); // domingo
  });

  it("nunca usa un precio posterior a la fecha, ni uno demasiado viejo", () => {
    expect(cierreEnFecha(serie, "2026-03-01")).toBeNull();
    expect(cierreEnFecha(serie, "2026-04-30")).toBeNull();
  });

  it("lo que se guardó antes de esta función se sigue leyendo (costoDesdeCierre = false)", () => {
    const viejo: Record<string, unknown> = { ...cedear(10) };
    delete viejo.costoDesdeCierre;
    const r = tenenciaSchema.safeParse(viejo);
    expect(r.success && r.data.costoDesdeCierre).toBe(false);
  });
});
