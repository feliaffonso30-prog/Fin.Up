import { describe, expect, it } from "vitest";
import { conPuntoDeHoy, fechasDelGrafico, fotoDeHoy, reconstruirEvolucion, registrarFoto, type FotoDia } from "./evolucion";
import { esMedioConfiable, nombreParaBuscar, parsearRss } from "./noticias";
import { esFinDeSemana, resumirMovimiento } from "./resumen";
import type { Precios, Tenencia } from "./tipos";
import { valuar } from "./valuar";

const HOY = "2026-11-20"; // viernes
const MEP = 1000;

const base: Tenencia = {
  id: "x",
  tipo: "cedear",
  simbolo: "AAPL",
  nombre: "Apple",
  categoria: "variable",
  invertido: { monto: 100_000, moneda: "ARS" },
  costoEstimado: false,
  costoDesdeCierre: false,
  cantidad: 10,
  cantidadEstimada: false,
  tna: null,
  valorManual: null,
  fecha: "2026-11-01",
  mepAlAnotar: MEP,
};

const apple: Tenencia = base;
const bitcoin: Tenencia = { ...base, id: "btc", tipo: "cripto", simbolo: "BTC", nombre: "Bitcoin", categoria: "alternativo", invertido: { monto: 100, moneda: "USD" }, cantidad: 0.002 };

const p = (precio: number, variacionDiaPct: number, moneda: "USD" | "ARS" = "USD") => ({ simbolo: "", precio, moneda, variacionDiaPct, actualizado: null, fuente: "" });

// Apple vía BYMA en pesos (+1%), Bitcoin en USD (−5%).
const precios = (appleVar: number, btcVar: number): Precios => ({
  "BYMA:AAPL": p(11_000, appleVar, "ARS"),
  "BTC-USD": p(50_000, btcVar),
});

const PROHIBIDO = /compr[aá](?![a-zñ])|vend[eé](?![a-zñ])|rebalance|te recomendamos|deber[ií]as/i;

describe("resumen del movimiento", () => {
  it("día de baja: cuenta cuánto bajó y qué pesó más (el resultado total ya está arriba)", () => {
    const v = valuar([apple, bitcoin], precios(0.2, -5), MEP, HOY);
    const r = resumirMovimiento(v, "ARS", MEP, HOY);
    expect(r.frases[0]).toMatch(/^Hoy tus inversiones bajaron \$/);
    expect(r.frases[1]).toMatch(/Bitcoin/);
    expect(r.frases[1]).toMatch(/la parte que más sube y baja/);
    expect(r.frases).toHaveLength(2);
    expect(r.protagonista?.tenencia.id).toBe("btc");
    expect(r.preguntaFinBot).toMatch(/Bitcoin \(BTC\) bajó/);
  });

  it("día de suba: lo que más empujó", () => {
    const v = valuar([apple, bitcoin], precios(3, 0.5), MEP, HOY);
    const r = resumirMovimiento(v, "ARS", MEP, HOY);
    expect(r.frases[0]).toMatch(/subieron/);
    expect(r.frases[1]).toMatch(/Apple/);
  });

  it("si casi no se movió, lo dice y no busca protagonista", () => {
    const v = valuar([apple], precios(0.01, 0), MEP, HOY);
    const r = resumirMovimiento(v, "ARS", MEP, HOY);
    expect(r.frases[0]).toMatch(/casi no se movieron/);
    expect(r.protagonista).toBeNull();
  });

  it("con una sola inversión no repite quién la movió", () => {
    const v = valuar([apple], precios(2, 0), MEP, HOY);
    expect(resumirMovimiento(v, "ARS", MEP, HOY).frases).toHaveLength(1);
  });

  it("sin nada con precio del día (plazo fijo) no inventa un resumen", () => {
    const pf: Tenencia = { ...base, id: "pf", tipo: "plazo-fijo", simbolo: null, cantidad: null, tna: 0.3 };
    expect(resumirMovimiento(valuar([pf], {}, MEP, HOY), "ARS", MEP, HOY).frases).toEqual([]);
  });

  it("el fin de semana habla del último día de mercado", () => {
    expect(esFinDeSemana("2026-11-21")).toBe(true);
    expect(esFinDeSemana(HOY)).toBe(false);
    const v = valuar([apple], precios(2, 0), MEP, "2026-11-21");
    expect(resumirMovimiento(v, "ARS", MEP, "2026-11-21").frases[0]).toMatch(/^En el último día de mercado/);
  });

  it("nunca dice qué hacer, ni en el resumen ni en la pregunta para FinBot", () => {
    for (const [a, b] of [[3, 0.5], [0.2, -5], [-2, -1], [0, 0]]) {
      const v = valuar([apple, bitcoin], precios(a, b), MEP, HOY);
      for (const m of ["ARS", "USD"] as const) {
        const r = resumirMovimiento(v, m, MEP, HOY);
        for (const f of [...r.frases, r.preguntaFinBot]) expect(f).not.toMatch(PROHIBIDO);
      }
    }
  });
});

describe("evolución", () => {
  it("toma como mucho `max` fechas y siempre termina en hoy", () => {
    const f = fechasDelGrafico("2025-01-01", HOY, 50);
    expect(f.length).toBeLessThanOrEqual(51);
    expect(f[0]).toBe("2025-01-01");
    expect(f.at(-1)).toBe(HOY);
    expect(fechasDelGrafico("2026-11-18", HOY)).toEqual(["2026-11-18", "2026-11-19", HOY]);
  });

  it("reconstruye cantidad × cierre de cada día, y antes de comprar no cuenta nada", () => {
    const t: Tenencia = { ...apple, fecha: "2026-11-18" };
    const series = {
      "BYMA:AAPL": [
        { fecha: "2026-11-17", cierre: 9_000 },
        { fecha: "2026-11-18", cierre: 10_000 },
        { fecha: "2026-11-19", cierre: 10_500 },
        { fecha: "2026-11-20", cierre: 11_000 },
      ],
    };
    const mep = [{ fecha: "2026-11-17", cierre: MEP }];
    const pts = reconstruirEvolucion([t], series, mep, HOY);
    expect(pts.map((x) => x.fecha)).toEqual(["2026-11-18", "2026-11-19", HOY]);
    expect(pts.map((x) => Math.round(x.valorArs))).toEqual([100_000, 105_000, 110_000]);
    expect(pts.every((x) => x.costoArs === 100_000)).toBe(true);
  });

  it("si falta el precio de un día, cuenta lo que puso (no inventa)", () => {
    const pts = reconstruirEvolucion([apple], {}, [], "2026-11-02");
    expect(pts.every((x) => x.valorArs === x.costoArs)).toBe(true);
  });

  it("lo cargado a mano vale lo que puso hasta el día en que cargó un valor", () => {
    const m: Tenencia = { ...base, id: "m", tipo: "manual", simbolo: "GGAL", cantidad: null, fecha: "2026-11-18", valorManual: { monto: 120_000, moneda: "ARS", fecha: "2026-11-19" } };
    const pts = reconstruirEvolucion([m], {}, [], HOY);
    expect(pts.map((x) => x.valorArs)).toEqual([100_000, 120_000, 120_000]);
  });

  it("el último punto es la valuación en vivo", () => {
    const v = valuar([apple], precios(1, 0), MEP, HOY);
    const pts = conPuntoDeHoy([{ fecha: HOY, valorArs: 1, valorUsd: 1, costoArs: 1, costoUsd: 1 }], v, HOY);
    expect(pts.at(-1)?.valorArs).toBeCloseTo(v.totalArs);
  });

  it("fotos diarias: una por día, ordenadas, y no se guarda un total incompleto", () => {
    const f = (fecha: string, valorArs: number): FotoDia => ({ fecha, valorArs, valorUsd: 0, costoArs: 0, costoUsd: 0 });
    let fotos = registrarFoto([], f("2026-11-19", 1));
    fotos = registrarFoto(fotos, f("2026-11-18", 2));
    fotos = registrarFoto(fotos, f("2026-11-19", 3));
    expect(fotos.map((x) => [x.fecha, x.valorArs])).toEqual([["2026-11-18", 2], ["2026-11-19", 3]]);
    expect(registrarFoto(fotos, f("2026-11-20", 4), 2).map((x) => x.fecha)).toEqual(["2026-11-19", "2026-11-20"]);
    expect(fotoDeHoy(valuar([apple], {}, MEP, HOY), HOY)).toBeNull(); // sin precio: incompleta
  });
});

describe("noticias", () => {
  it("busca por un nombre corto", () => {
    expect(nombreParaBuscar("Apple Inc.")).toBe("Apple");
    expect(nombreParaBuscar("Microsoft Corporation")).toBe("Microsoft");
    expect(nombreParaBuscar("Grupo Financiero Galicia")).toBe("Grupo Financiero Galicia");
  });

  it("solo medios confiables, recientes, sin repetir y como mucho dos", () => {
    const item = (titulo: string, medio: string, fecha: string) =>
      `<item><title>${titulo} - ${medio}</title><link>https://news.google.com/x/${encodeURIComponent(titulo)}</link><pubDate>${fecha}</pubDate><source url="https://x">${medio}</source></item>`;
    const xml = `<rss><channel>${[
      item("Sube Galicia", "Ámbito", "Fri, 20 Nov 2026 15:00:00 GMT"),
      item("Sube Galicia", "Infobae", "Fri, 20 Nov 2026 14:00:00 GMT"),
      item("Señales para ganar ya", "BlogCripto", "Fri, 20 Nov 2026 16:00:00 GMT"),
      item("Vieja", "La Nación", "Mon, 02 Nov 2026 10:00:00 GMT"),
      item("Bancos en foco &amp; más", "El Cronista", "Thu, 19 Nov 2026 10:00:00 GMT"),
      item("Tercera", "Reuters", "Wed, 18 Nov 2026 10:00:00 GMT"),
    ].join("")}</channel></rss>`;
    const n = parsearRss(xml, new Date("2026-11-20T18:00:00Z"));
    expect(n.map((x) => [x.titulo, x.medio])).toEqual([
      ["Sube Galicia", "Ámbito"],
      ["Bancos en foco & más", "El Cronista"],
    ]);
    expect(esMedioConfiable("BlogCripto")).toBe(false);
  });
});
