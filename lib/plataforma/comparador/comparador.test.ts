import { describe, expect, it } from "vitest";
import { interesSimple } from "../finanzas";
import { cotizar, cotizarTodas, mejorPorTipo, ranking, tnaPlazoFijo } from "./cotizar";
import { hrefComparador, PESTANA_POR_CATEGORIA } from "./desde-cartera";
import { buscarEnlace, claveEntidad } from "./enlaces";
import {
  nombreEntidad,
  normalizarBilleteras,
  normalizarFci,
  normalizarPlazoFijo,
  normalizarDolarMep,
  normalizarUva,
  recortarFci,
  ultimaInflacion,
  usdAArs,
} from "./normalizar";
import type { Alternativa, Consulta } from "./tipos";

// Muestras reales de ArgentinaDatos (9-oct-2026), recortadas.
import fondos from "./fixtures/fondos.json";
import inflacionApi from "./fixtures/inflacion.json";
import plazoFijoApi from "./fixtures/plazo-fijo.json";
import precancelableApi from "./fixtures/precancelable.json";
import rendimientosApi from "./fixtures/rendimientos.json";

const HOY = "2026-10-09";
const pf = normalizarPlazoFijo(plazoFijoApi, HOY);
const uva = normalizarUva(precancelableApi, HOY);
const billeteras = normalizarBilleteras(rendimientosApi, HOY);
const fci = normalizarFci(fondos);
const inflacion = ultimaInflacion(inflacionApi);

const porEntidad = (lista: Alternativa[], texto: string) => {
  const a = lista.find((x) => x.entidad.toLowerCase().includes(texto.toLowerCase()));
  if (!a) throw new Error(`No está ${texto}`);
  return a;
};
const consulta = (c: Partial<Consulta> = {}): Consulta => ({ monto: 1_000_000, dias: 30, esCliente: true, ...c });

describe("normalizar plazo fijo", () => {
  it("convierte cada banco a una alternativa completa", () => {
    expect(pf).toHaveLength(4);
    const nacion = porEntidad(pf, "Nacion");
    expect(nacion).toMatchObject({
      tipo: "plazo-fijo",
      entidad: "Banco de la Nacion Argentina",
      tna: 0.1925,
      liquidez: "al-vencimiento",
      riesgo: "Bajo",
      fecha: HOY,
      esReferido: false,
      tnaNoClientes: null, // la API manda 0: no ofrece a no clientes
    });
    expect(nacion.tea).toBeGreaterThan(nacion.tna);
    expect(nacion.fuente.nombre).toMatch(/BCRA/);
  });

  it("descarta entradas rotas sin romper la lista", () => {
    const sucio = [null, { entidad: "X" }, { entidad: "Y", tnaClientes: 0 }, { entidad: "Z", tnaClientes: "0.2" }, ...plazoFijoApi];
    expect(normalizarPlazoFijo(sucio, HOY)).toHaveLength(4);
    expect(normalizarPlazoFijo(null, HOY)).toEqual([]);
    expect(normalizarPlazoFijo({ error: "caída" }, HOY)).toEqual([]);
  });
});

describe("tasa de plazo fijo según plazo, monto y si es cliente", () => {
  const nacion = porEntidad(pf, "Nacion");
  const provincia = porEntidad(pf, "Provincia");
  const macro = porEntidad(pf, "Macro");
  const uala = porEntidad(pf, "Ualá");

  it("usa el tramo exacto cuando existe", () => {
    expect(tnaPlazoFijo(nacion, consulta({ dias: 90 }))).toEqual({ tna: 0.2 });
  });

  it("sin tramo para ese plazo usa el más largo que no se pasa, y lo avisa", () => {
    const r = tnaPlazoFijo(nacion, consulta({ dias: 180 }));
    expect(r.tna).toBe(0.2); // tramo de 90 días
    expect(r.nota).toMatch(/180 días/);
  });

  it("a 30 días sin tramo usa la tasa de cartel sin aviso", () => {
    expect(tnaPlazoFijo(nacion, consulta())).toEqual({ tna: 0.1925, nota: undefined, tasaBase: true });
  });

  it("las condiciones del banco solo se muestran con la tasa de cartel", () => {
    const conCondiciones = { ...uala, nota: "Plazo de 30 días, mínimo $1.000." };
    expect(cotizar(conCondiciones, consulta(), inflacion).nota).toBe(conCondiciones.nota);
    expect(cotizar(conCondiciones, consulta({ dias: 180 }), inflacion).nota).toBeUndefined(); // usa el tramo de 180
  });

  it("respeta los tramos por monto", () => {
    expect(tnaPlazoFijo(macro, consulta({ monto: 1_000_000 })).tna).toBe(0.195);
    expect(tnaPlazoFijo(macro, consulta({ monto: 6_000_000 })).tna).toBe(0.2);
  });

  it("no clientes: sin oferta → no disponible", () => {
    const c = cotizar(nacion, consulta({ esCliente: false }), inflacion);
    expect(c.disponible).toBe(false);
    expect(c.motivoNoDisponible).toMatch(/no clientes/);
  });

  it("no clientes con tasa propia usa esa tasa", () => {
    expect(tnaPlazoFijo(provincia, consulta({ esCliente: false })).tna).toBe(0.22);
  });

  it("si la tasa es igual para todos, los tramos valen también para no clientes", () => {
    expect(tnaPlazoFijo(uala, consulta({ esCliente: false, dias: 180 })).tna).toBe(0.25);
  });
});

describe("cotizar", () => {
  it("calcula la ganancia del plazo fijo con interés simple", () => {
    const c = cotizar(porEntidad(pf, "Nacion"), consulta(), inflacion);
    expect(c.disponible).toBe(true);
    expect(c.ganancia).toBeCloseTo(interesSimple(1_000_000, 0.1925, 30), 6);
    expect(c.tasaRealMensual).not.toBeNull();
    // 19,25% TNA ≈ 1,58% mensual < 1,7% de inflación
    expect(c.leGanaALaInflacion).toBe(false);
  });

  it("sin dato de inflación no inventa la tasa real", () => {
    const c = cotizar(porEntidad(pf, "Ualá"), consulta(), null);
    expect(c.disponible).toBe(true);
    expect(c.tasaRealMensual).toBeNull();
    expect(c.leGanaALaInflacion).toBeNull();
  });

  it("monto 0 o negativo → no disponible, ganancia 0", () => {
    for (const monto of [0, -1000, Number.NaN]) {
      const c = cotizar(porEntidad(pf, "Ualá"), consulta({ monto }), inflacion);
      expect(c.disponible).toBe(false);
      expect(c.ganancia).toBe(0);
    }
  });

  it("UVA: respeta plazo y montos mínimos/máximos", () => {
    const bna = porEntidad(uva, "Nación");
    expect(cotizar(bna, consulta({ dias: 30 }), inflacion).motivoNoDisponible).toBe("Plazo mínimo: 180 días.");
    expect(cotizar(bna, consulta({ dias: 180, monto: 6_000_000 }), inflacion).disponible).toBe(false);
    expect(cotizar(bna, consulta({ dias: 180, monto: 1000 }), inflacion).motivoNoDisponible).toMatch(/Monto mínimo/);
  });

  it("UVA: estima con la última inflación, lo aclara y le gana por construcción", () => {
    const c = cotizar(porEntidad(uva, "Nación"), consulta({ dias: 180 }), inflacion);
    expect(c.disponible).toBe(true);
    expect(c.rendimientoPeriodo).toBeGreaterThan(0.1); // ~1,7% mensual × 6 meses + 1%
    expect(c.leGanaALaInflacion).toBe(true);
    expect(c.notas.join(" ")).toMatch(/suponiendo que la inflación sigue en 1,7%/);
  });

  it("UVA sin inflación no se puede estimar", () => {
    expect(cotizar(porEntidad(uva, "Provincia"), consulta({ dias: 90 }), null).disponible).toBe(false);
  });

  it("billetera: rinde compuesto sobre la TEA", () => {
    const c = cotizar(porEntidad(billeteras, "Let"), consulta({ dias: 365 }), inflacion);
    expect(c.rendimientoPeriodo).toBeCloseTo(0.2029, 8);
  });
});

describe("normalizar UVA, billeteras, FCI e inflación", () => {
  it("UVA precancelable: no muestra una tasa de precancelación absurda", () => {
    expect(uva).toHaveLength(2);
    const bna = porEntidad(uva, "Nación");
    expect(bna.nota).toMatch(/Verificá esa tasa/);
    expect(bna.nota).not.toMatch(/83/);
    expect(porEntidad(uva, "Provincia").nota).toMatch(/TNA 10%/);
  });

  it("billeteras: solo pesos, APY en % pasado a decimal, sin garantía de depósitos", () => {
    expect(billeteras.map((b) => b.entidad).sort()).toEqual(["Fiwind", "Let'sBit"]); // Nexo no tiene ARS
    const letsbit = porEntidad(billeteras, "Let");
    expect(letsbit.tea).toBeCloseTo(0.2029, 10);
    expect(letsbit.liquidez).toBe("inmediata");
    expect(letsbit.nota).toMatch(/SEDESA/);
    expect(porEntidad(billeteras, "Fiwind").nota).toMatch(/bonificada/);
  });

  it("billeteras: descarta rendimientos viejos (discontinuados)", () => {
    const viejo = [{ entidad: "fiwind", rendimientos: [{ moneda: "ARS", apy: 30, fecha: "2026-01-01" }] }];
    expect(normalizarBilleteras(viejo, HOY)).toEqual([]);
  });

  it("FCI: solo pesos, vigentes, con rendimiento de 30 días y tamaño mínimo", () => {
    expect(fci.map((f) => f.producto).sort()).toEqual([
      "1810 Ahorro",
      "1810 Ahorros Activos",
      "Alpha Planeamiento Conservador - Clase B",
    ]);
    // Quedan afuera: dólares, clase blanqueo, clase chica, dato de 7 días, fondo sin datos, renta variable.
  });

  it("FCI: tipo, liquidez y riesgo", () => {
    const mm = fci.find((f) => f.producto === "1810 Ahorro")!;
    expect(mm).toMatchObject({ tipo: "fci-mm", liquidez: "inmediata", riesgo: "Bajo", entidad: "Proahorro Administradora de Activos S.A." });
    expect(mm.tna).toBeCloseTo(0.190469, 6);
    const rf = fci.find((f) => f.producto === "1810 Ahorros Activos")!;
    expect(rf).toMatchObject({ tipo: "fci-rf", liquidez: "24-48h", riesgo: "Medio" });
    expect(fci.find((f) => f.producto.startsWith("Alpha"))!.riesgo).toBe("Alto"); // largo plazo
  });

  it("FCI: tolera respuestas vacías o con otra forma", () => {
    expect(normalizarFci(null)).toEqual([]);
    expect(normalizarFci({})).toEqual([]);
    expect(normalizarFci({ fondos: [] })).toEqual([]);
  });

  it("inflación: toma el último mes y lo pasa a decimal", () => {
    expect(inflacion).toEqual({ mensual: 0.017, fecha: "2026-08-31" });
    expect(ultimaInflacion([])).toBeNull();
    expect(ultimaInflacion("x")).toBeNull();
  });
});

describe("ranking", () => {
  it("ordena por ganancia, con las no disponibles al final", () => {
    const r = cotizarTodas(pf, consulta({ esCliente: false }), inflacion);
    // Provincia y Ualá empatan en 22%: desempata el nombre.
    expect(r.map((c) => c.alternativa.entidad)).toEqual([
      "Banco de la Provincia de Buenos Aires",
      "Ualá",
      "Banco de la Nacion Argentina",
      "Banco Macro",
    ]);
    expect(r.slice(-2).every((c) => !c.disponible)).toBe(true);
  });

  it("es determinístico ante empates", () => {
    const todas = pf.map((a) => cotizar(a, consulta(), inflacion));
    expect(ranking(todas)).toEqual(ranking([...todas].reverse()));
  });

  it("mejor por tipo: una por tipo, solo disponibles", () => {
    const todas = [...pf, ...uva, ...billeteras, ...fci].map((a) => cotizar(a, consulta({ dias: 30 }), inflacion));
    const mejores = mejorPorTipo(todas);
    expect(mejores["plazo-fijo"]?.alternativa.entidad).toBe("Ualá"); // 22% a 30 días
    expect(mejores.billetera?.alternativa.entidad).toBe("Let'sBit");
    expect(mejores.uva).toBeUndefined(); // ninguno acepta 30 días
    expect(mejores["fci-mm"]?.alternativa.producto).toBe("1810 Ahorro");
  });
});

describe("recorte de FCI y dólar MEP", () => {
  const fondo = (i: number, tipo: "fci-mm" | "fci-rf", tna: number, patrimonio: number): Alternativa => ({
    ...fci[0],
    id: `${tipo}:${i}`,
    tipo,
    tna,
    patrimonio,
  });

  it("se queda con los de mayor TNA y los más grandes de cada tipo", () => {
    const lista = [
      fondo(1, "fci-mm", 0.3, 1e9),
      fondo(2, "fci-mm", 0.1, 9e12), // el más grande
      fondo(3, "fci-mm", 0.2, 2e9),
      fondo(4, "fci-rf", 0.5, 1e9),
      fondo(5, "fci-rf", 0.1, 1e9),
    ];
    expect(recortarFci(lista, 1).map((f) => f.id)).toEqual(["fci-mm:1", "fci-mm:2", "fci-rf:4"]);
  });

  it("lee el MEP de DolarAPI y descarta respuestas rotas", () => {
    const api = { compra: 1538.4, venta: 1542.7, fechaActualizacion: "2026-10-08T20:58:00.000Z" };
    expect(normalizarDolarMep(api)).toEqual({ compra: 1538.4, venta: 1542.7, fecha: "2026-10-08T20:58:00.000Z" });
    expect(normalizarDolarMep({ ...api, compra: null })).toBeNull();
    expect(normalizarDolarMep({ ...api, venta: 0 })).toBeNull();
    expect(normalizarDolarMep(null)).toBeNull();
  });

  it("pasa USD a ARS al MEP de compra, redondeado a $1.000", () => {
    const mep = { compra: 1538.4, venta: 1542.7, fecha: "2026-10-08T20:58:00.000Z" };
    expect(usdAArs(250, mep)).toBe(385_000); // 384.600 → 385.000
    expect(usdAArs(0.1, mep)).toBe(1000); // nunca 0 si había algo
    expect(usdAArs(0, mep)).toBe(0);
    expect(usdAArs(-5, mep)).toBe(0);
  });
});

describe("link desde la cartera", () => {
  it("liquidez y renta fija llevan al comparador con el monto en USD", () => {
    expect(hrefComparador({ categoria: "liquidez", montoInicial: 250 })).toBe("/comparador?tab=billeteras&usd=250");
    expect(hrefComparador({ categoria: "fija", montoInicial: 549.6 })).toBe("/comparador?tab=todo&usd=550");
  });

  it("sin capital, el link va sin monto", () => {
    expect(hrefComparador({ categoria: "liquidez", montoInicial: 0 })).toBe("/comparador?tab=billeteras");
  });

  it("acciones, dividendos y cripto no tienen alternativas en pesos para comparar", () => {
    for (const categoria of ["variable", "dividendos", "alternativo"] as const) {
      expect(hrefComparador({ categoria, montoInicial: 100 })).toBeNull();
    }
  });

  it("todas las pestañas a las que lleva existen en el comparador", () => {
    for (const tab of Object.values(PESTANA_POR_CATEGORIA)) expect(["todo", "plazo-fijo", "uva", "billeteras", "fci"]).toContain(tab);
  });
});

describe("enlaces y nombres", () => {
  it("normaliza nombres de entidades", () => {
    expect(nombreEntidad("BANCO DE LA NACION ARGENTINA")).toBe("Banco de la Nacion Argentina");
    expect(nombreEntidad("BANCO BBVA ARGENTINA S.A.")).toBe("Banco BBVA Argentina");
    expect(nombreEntidad("Banco Piano")).toBe("Banco Piano");
    expect(nombreEntidad("CRÉDITO REGIONAL COMPAÑÍA FINANCIERA S.A.U.")).toBe("Crédito Regional Compañía Financiera");
    expect(nombreEntidad("INDUSTRIAL AND COMMERCIAL BANK OF CHINA (ARGENTINA) S.A.U.")).toBe(
      "Industrial and Commercial Bank of China (Argentina)",
    );
  });

  it("la clave ignora mayúsculas, acentos y S.A.", () => {
    expect(claveEntidad("BANCO MACRO S.A.")).toBe(claveEntidad("Banco Macro"));
    expect(claveEntidad("Banco de la Nación Argentina")).toBe(claveEntidad("BANCO DE LA NACION ARGENTINA"));
  });

  it("prioriza el link propio, marca referidos y rechaza lo que no es http(s)", () => {
    const mapa = new Map([[claveEntidad("Banco Macro"), { url: "https://ejemplo.com/ref", esReferido: true }]]);
    expect(buscarEnlace("BANCO MACRO S.A.", "https://macro.com.ar", mapa)).toEqual({ url: "https://ejemplo.com/ref", esReferido: true });
    expect(buscarEnlace("UALA", "https://uala.com.ar", mapa)).toEqual({ url: "https://uala.com.ar", esReferido: false });
    expect(buscarEnlace("UALA", "javascript:alert(1)", mapa)).toEqual({ url: null, esReferido: false });
    expect(buscarEnlace("UALA", null, mapa)).toEqual({ url: null, esReferido: false });
  });
});

describe("lenguaje neutro", () => {
  it("ningún texto generado recomienda invertir", () => {
    const todas = [...pf, ...uva, ...billeteras, ...fci];
    const textos = todas.flatMap((a) => {
      const c = cotizar(a, consulta({ dias: 180 }), inflacion);
      return [a.nota ?? "", c.motivoNoDisponible ?? "", ...c.notas];
    });
    for (const t of textos) expect(t).not.toMatch(/recomend|te conviene|invertí en/i);
  });
});
