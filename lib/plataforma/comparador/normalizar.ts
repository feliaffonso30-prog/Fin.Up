// Del JSON crudo de ArgentinaDatos a `Alternativa`. Puro: recibe los datos ya
// descargados (la descarga y la caché viven en lib/comparador/fuentes.ts).
// Lo que viene de afuera se valida campo por campo: una entrada rara se
// descarta, nunca rompe la lista.

import { teaATem, teaATna, tnaATea, tnaATem } from "../finanzas";
import { buscarEnlace, claveEntidad } from "./enlaces";
import type { Alternativa, Fuente, Inflacion, NivelRiesgo, Tramo } from "./tipos";

// ---------- Forma del JSON de cada endpoint (solo los campos que usamos) ----------

/** GET /v1/finanzas/tasas/plazoFijo */
export interface PlazoFijoApi {
  entidad: string;
  tnaClientes: number | null;
  tnaNoClientes: number | null; // 0 = no ofrece a no clientes
  enlace: string | null;
  tasas?: Array<Partial<Tramo>> | null;
  condicionesCorto?: string | null;
}

/** GET /v1/finanzas/tasas/plazoFijoPrecancelable */
export interface PrecancelableApi {
  id: string;
  entidad: string;
  enlace: string | null;
  plazoMinDias: number | null;
  plazoPrecancelacionDias: number | null;
  montoMinimo: number | null;
  montoMaximo: number | null;
  tna: number; // por encima de la UVA
  tnaPrecancelacion: number | null;
}

/** GET /v1/finanzas/rendimientos */
export interface RendimientosApi {
  entidad: string;
  rendimientos: Array<{
    moneda: string;
    apy: number; // en %: 17.2 = 17,2% efectivo anual
    fecha: string;
    bonusValue?: number | null;
    bonusThreshold?: number | null;
  }>;
}

/** GET /v1/finanzas/fci/fondos → `fondos[]` */
export interface FondoApi {
  nombre: string;
  fecha: string;
  administradora: string | null;
  tipoRenta: string | null; // "Mercado de Dinero", "Renta Fija", ...
  horizonte: string | null; // "Corto Plazo", "Largo Plazo", ...
  duracion: string | null; // "Mayor a 3 Años", ...
  moneda: string | null; // "Peso Argentino" | "Dolar Estadounidense"
  patrimonio: number | null;
  inversionMinima: number | null;
  plazoLiquidacionDias: number | null;
  rendimientos: {
    tnaEstimada: number | null; // en %, últimos 30 días anualizados
    tnaEstimadaPeriodo: string | null; // "unMes" | "ultimos7Dias"
  } | null;
}

/** GET /v1/finanzas/indices/inflacion */
export interface InflacionApi {
  fecha: string;
  valor: number; // en %: 1.7 = 1,7% mensual
}

// ---------- Fuentes ----------

const DOCS = "https://argentinadatos.com/docs/";
export const FUENTES = {
  plazoFijo: { nombre: "BCRA vía ArgentinaDatos", url: DOCS },
  uva: { nombre: "Bancos vía ArgentinaDatos", url: DOCS },
  billeteras: { nombre: "Entidades vía ArgentinaDatos", url: DOCS },
  fci: { nombre: "CAFCI vía ArgentinaDatos", url: DOCS },
  inflacion: { nombre: "INDEC vía ArgentinaDatos", url: DOCS },
} satisfies Record<string, Fuente>;

// ---------- Ayudas ----------

const esNumero = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const numeroONull = (x: unknown): number | null => (esNumero(x) ? x : null);
/** Una TNA razonable en decimal (descarta 0, negativos y errores de carga). */
const tnaValida = (x: unknown): x is number => esNumero(x) && x > 0 && x < 5;
const esFecha = (x: unknown): x is string => typeof x === "string" && /^\d{4}-\d{2}-\d{2}/.test(x);

const diasEntre = (desde: string, hasta: string) =>
  Math.round((Date.parse(hasta.slice(0, 10)) - Date.parse(desde.slice(0, 10))) / 86_400_000);

const slug = (s: string) => claveEntidad(s).toLowerCase().replace(/ /g, "-");

const SIGLAS = new Set(["BBVA", "CMF", "BICA", "VOII", "ICBC", "REBA", "BNA"]);
const MINUSCULAS = new Set(["de", "del", "la", "las", "los", "y", "of", "and"]);
/** Nombres que no salen bien de pasar mayúsculas a minúsculas. */
const NOMBRES_PROPIOS: Record<string, string> = { UALA: "Ualá" };

/** "BANCO DE LA NACION ARGENTINA" → "Banco de la Nacion Argentina". Lo que ya viene en mayúsculas y minúsculas queda igual. */
export function nombreEntidad(crudo: string): string {
  const limpio = crudo.replace(/\s+S\.?\s?A\.?(\s?U\.?)?$/i, "").replace(/\s+SOCIEDAD ANONIMA$/i, "").trim();
  if (NOMBRES_PROPIOS[limpio]) return NOMBRES_PROPIOS[limpio];
  if (limpio !== limpio.toUpperCase()) return limpio;
  return limpio
    .split(" ")
    .map((p, i) => {
      if (SIGLAS.has(p)) return p;
      const min = p.toLowerCase();
      if (i > 0 && MINUSCULAS.has(min)) return min;
      return min.replace(/^([^a-záéíóúñ]*)(.)/, (_, signos: string, letra: string) => signos + letra.toUpperCase());
    })
    .join(" ");
}

const NOMBRES_BILLETERAS: Record<string, string> = {
  fiwind: "Fiwind",
  letsbit: "Let'sBit",
  belo: "Belo",
  lemoncash: "Lemon Cash",
  ripio: "Ripio",
  satoshitango: "SatoshiTango",
  lucamoney: "Luca Money",
  decrypto: "Decrypto",
  astropay: "AstroPay",
  nexo: "Nexo",
};

const formatoArs = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

// ---------- Plazo fijo tradicional ----------

export function normalizarPlazoFijo(datos: unknown, fechaConsulta: string): Alternativa[] {
  if (!Array.isArray(datos)) return [];
  const salida: Alternativa[] = [];
  for (const d of datos as PlazoFijoApi[]) {
    if (!d || typeof d.entidad !== "string" || !tnaValida(d.tnaClientes)) continue;
    const tramos: Tramo[] = (Array.isArray(d.tasas) ? d.tasas : [])
      .filter((t) => t && tnaValida(t.tna))
      .map((t) => ({
        plazoMinDias: numeroONull(t.plazoMinDias),
        plazoMaxDias: numeroONull(t.plazoMaxDias),
        montoMinimo: numeroONull(t.montoMinimo),
        montoMaximo: numeroONull(t.montoMaximo),
        tna: t.tna as number,
      }));
    const entidad = nombreEntidad(d.entidad);
    salida.push({
      id: `plazo-fijo:${slug(d.entidad)}`,
      tipo: "plazo-fijo",
      entidad,
      producto: "Plazo fijo tradicional",
      tna: d.tnaClientes,
      tea: tnaATea(d.tnaClientes),
      tem: tnaATem(d.tnaClientes),
      capitalizacion: "simple",
      liquidez: "al-vencimiento",
      riesgo: "Bajo",
      plazoMinDias: 30,
      montoMinimo: null,
      montoMaximo: null,
      tramos,
      tnaNoClientes: tnaValida(d.tnaNoClientes) ? d.tnaNoClientes : null,
      fecha: fechaConsulta,
      fuente: FUENTES.plazoFijo,
      ...buscarEnlace(d.entidad, d.enlace),
      nota: typeof d.condicionesCorto === "string" && d.condicionesCorto.trim() ? d.condicionesCorto.trim() : undefined,
    });
  }
  return salida;
}

// ---------- Plazo fijo UVA precancelable ----------

// Una tasa de precancelación por encima de esto es casi seguro un error de carga
// (a oct-2026 una entidad informa 83%): no la mostramos y pedimos verificarla.
const TNA_PRECANCELACION_MAXIMA = 0.6;

export function normalizarUva(datos: unknown, fechaConsulta: string): Alternativa[] {
  if (!Array.isArray(datos)) return [];
  const salida: Alternativa[] = [];
  for (const d of datos as PrecancelableApi[]) {
    if (!d || typeof d.entidad !== "string" || !esNumero(d.tna) || d.tna < 0 || d.tna > 1) continue;
    const desde = numeroONull(d.plazoPrecancelacionDias);
    const tnaPre = numeroONull(d.tnaPrecancelacion);
    let nota: string | undefined;
    if (desde !== null) {
      nota =
        tnaPre !== null && tnaPre > 0 && tnaPre <= TNA_PRECANCELACION_MAXIMA
          ? `Podés retirarlo antes desde el día ${desde}; en ese caso cobrás una tasa fija (TNA ${(tnaPre * 100).toLocaleString("es-AR", { maximumFractionDigits: 2 })}%) en vez del ajuste por inflación.`
          : `Podés retirarlo antes desde el día ${desde}, con una tasa fija menor. Verificá esa tasa en el banco.`;
    }
    salida.push({
      id: `uva:${slug(d.id || d.entidad)}`,
      tipo: "uva",
      entidad: nombreEntidad(d.entidad),
      producto: "Plazo fijo UVA precancelable",
      tna: d.tna,
      tea: tnaATea(d.tna),
      tem: tnaATem(d.tna),
      capitalizacion: "uva",
      liquidez: "al-vencimiento",
      riesgo: "Bajo",
      plazoMinDias: numeroONull(d.plazoMinDias),
      montoMinimo: numeroONull(d.montoMinimo),
      montoMaximo: numeroONull(d.montoMaximo),
      fecha: fechaConsulta,
      fuente: FUENTES.uva,
      ...buscarEnlace(d.entidad, d.enlace),
      nota,
    });
  }
  return salida;
}

// ---------- Billeteras y cuentas remuneradas (solo pesos) ----------

/** Un rendimiento con fecha más vieja que esto se considera discontinuado. */
const ANTIGUEDAD_MAXIMA_DIAS = 30;

export function normalizarBilleteras(datos: unknown, fechaConsulta: string): Alternativa[] {
  if (!Array.isArray(datos)) return [];
  const salida: Alternativa[] = [];
  for (const e of datos as RendimientosApi[]) {
    if (!e || typeof e.entidad !== "string" || !Array.isArray(e.rendimientos)) continue;
    const r = e.rendimientos.find((x) => x && x.moneda === "ARS");
    if (!r || !esNumero(r.apy) || r.apy <= 0 || r.apy > 500 || !esFecha(r.fecha)) continue;
    if (diasEntre(r.fecha, fechaConsulta) > ANTIGUEDAD_MAXIMA_DIAS) continue;

    const tea = r.apy / 100;
    const notas = ["No es un depósito bancario: no tiene la garantía de depósitos (SEDESA)."];
    if (esNumero(r.bonusValue) && r.bonusValue > 0 && esNumero(r.bonusThreshold)) {
      notas.push(
        `Informa una tasa bonificada (${r.bonusValue}%) con un tope de $${formatoArs.format(r.bonusThreshold)}. Verificá las condiciones.`,
      );
    }
    const clave = e.entidad.toLowerCase();
    salida.push({
      id: `billetera:${slug(e.entidad)}`,
      tipo: "billetera",
      entidad: NOMBRES_BILLETERAS[clave] ?? e.entidad.charAt(0).toUpperCase() + e.entidad.slice(1),
      producto: "Cuenta remunerada en pesos",
      tna: teaATna(tea, 1), // capitaliza a diario
      tea,
      tem: teaATem(tea),
      capitalizacion: "compuesta",
      liquidez: "inmediata",
      riesgo: "Medio",
      plazoMinDias: null,
      montoMinimo: null,
      montoMaximo: null,
      fecha: r.fecha.slice(0, 10),
      fuente: FUENTES.billeteras,
      ...buscarEnlace(e.entidad, null),
      nota: notas.join(" "),
    });
  }
  return salida;
}

// ---------- FCI money market y renta fija (solo pesos) ----------

/** Clases con menos patrimonio que esto suelen ser institucionales o estar casi vacías. */
export const PATRIMONIO_MINIMO = 1_000_000_000; // ARS 1.000 millones
/** Un fondo cuyo último dato es más viejo que esto (vs. el más nuevo) dejó de informar. */
const DESFASE_MAXIMO_DIAS = 7;

const TIPOS_FCI = { "Mercado de Dinero": "fci-mm", "Renta Fija": "fci-rf" } as const;

function riesgoRentaFija(f: FondoApi): NivelRiesgo {
  if (f.horizonte === "Largo Plazo" || f.duracion === "Mayor a 3 Años") return "Alto";
  return "Medio";
}

export function normalizarFci(datos: unknown): Alternativa[] {
  const fondos: unknown = (datos as { fondos?: unknown } | null)?.fondos ?? datos;
  if (!Array.isArray(fondos)) return [];

  const candidatos = (fondos as FondoApi[]).filter(
    (f) =>
      f &&
      typeof f.nombre === "string" &&
      esFecha(f.fecha) &&
      f.moneda === "Peso Argentino" &&
      (f.tipoRenta === "Mercado de Dinero" || f.tipoRenta === "Renta Fija") &&
      !/27\.743/.test(f.nombre) && // clases exclusivas del blanqueo
      esNumero(f.patrimonio) &&
      f.patrimonio >= PATRIMONIO_MINIMO &&
      esNumero(f.plazoLiquidacionDias) &&
      f.plazoLiquidacionDias >= 0 &&
      f.plazoLiquidacionDias <= 2 &&
      f.rendimientos?.tnaEstimadaPeriodo === "unMes" && // 7 días es demasiado ruidoso
      esNumero(f.rendimientos.tnaEstimada) &&
      f.rendimientos.tnaEstimada > -100 &&
      f.rendimientos.tnaEstimada < 500,
  );
  if (candidatos.length === 0) return [];

  const masNueva = candidatos.reduce((max, f) => (f.fecha > max ? f.fecha : max), candidatos[0].fecha);

  return candidatos
    .filter((f) => diasEntre(f.fecha, masNueva) <= DESFASE_MAXIMO_DIAS)
    .map((f): Alternativa => {
      const tipo = TIPOS_FCI[f.tipoRenta as keyof typeof TIPOS_FCI];
      const tna = (f.rendimientos!.tnaEstimada as number) / 100;
      const mm = tipo === "fci-mm";
      return {
        id: `${tipo}:${slug(f.nombre)}`,
        tipo,
        entidad: f.administradora?.trim() || f.nombre,
        producto: f.nombre,
        tna,
        tea: tnaATea(tna),
        tem: tnaATem(tna),
        capitalizacion: "compuesta",
        liquidez: f.plazoLiquidacionDias === 0 ? "inmediata" : "24-48h",
        riesgo: mm ? "Bajo" : riesgoRentaFija(f),
        plazoMinDias: null,
        montoMinimo: esNumero(f.inversionMinima) && f.inversionMinima > 1 ? f.inversionMinima : null,
        montoMaximo: null,
        patrimonio: f.patrimonio as number,
        fecha: f.fecha.slice(0, 10),
        fuente: FUENTES.fci,
        ...buscarEnlace(f.administradora ?? f.nombre, null),
        nota: mm
          ? "Rendimiento de los últimos 30 días, anualizado. No está garantizado: puede cambiar todos los días."
          : "Rendimiento de los últimos 30 días, anualizado. No garantiza el futuro: el valor del fondo sube y baja, y puede dar negativo.",
      };
    });
}

/**
 * Achica la lista de FCI para mandarla al navegador: por cada tipo, los `n` de
 * mayor TNA más los `n` más grandes (para poder ordenar por tamaño también).
 */
export function recortarFci(fci: Alternativa[], n = 40): Alternativa[] {
  const elegidos = new Set<string>();
  for (const tipo of ["fci-mm", "fci-rf"] as const) {
    const delTipo = fci.filter((f) => f.tipo === tipo);
    [...delTipo].sort((a, b) => b.tna - a.tna).slice(0, n).forEach((f) => elegidos.add(f.id));
    [...delTipo].sort((a, b) => (b.patrimonio ?? 0) - (a.patrimonio ?? 0)).slice(0, n).forEach((f) => elegidos.add(f.id));
  }
  return fci.filter((f) => elegidos.has(f.id));
}

// ---------- Dólar MEP (para pasar los montos del plan, en USD, a pesos) ----------

/** GET https://dolarapi.com/v1/dolares/bolsa */
export interface DolarApi {
  compra: number | null;
  venta: number | null;
  fechaActualizacion: string;
}

export interface DolarMep {
  compra: number;
  venta: number;
  fecha: string; // ISO
}

export function normalizarDolarMep(datos: unknown): DolarMep | null {
  const d = datos as DolarApi | null;
  if (!d || !esNumero(d.compra) || !esNumero(d.venta) || d.compra <= 0 || d.venta <= 0 || !esFecha(d.fechaActualizacion)) {
    return null;
  }
  return { compra: d.compra, venta: d.venta, fecha: d.fechaActualizacion };
}

/**
 * USD → ARS al MEP de compra (lo que recibirías vendiendo esos dólares),
 * redondeado a $1.000 para que el monto precargado se lea como una estimación.
 */
export function usdAArs(usd: number, mep: DolarMep): number {
  if (!esNumero(usd) || usd <= 0) return 0;
  return Math.max(1000, Math.round((usd * mep.compra) / 1000) * 1000);
}

// ---------- Inflación ----------

/** Último dato de inflación mensual (en decimal). null si la serie no sirve. */
export function ultimaInflacion(datos: unknown): Inflacion | null {
  if (!Array.isArray(datos)) return null;
  let ultimo: InflacionApi | null = null;
  for (const d of datos as InflacionApi[]) {
    if (!d || !esFecha(d.fecha) || !esNumero(d.valor) || d.valor <= -50 || d.valor >= 100) continue;
    if (!ultimo || d.fecha > ultimo.fecha) ultimo = d;
  }
  return ultimo ? { mensual: ultimo.valor / 100, fecha: ultimo.fecha.slice(0, 10) } : null;
}
