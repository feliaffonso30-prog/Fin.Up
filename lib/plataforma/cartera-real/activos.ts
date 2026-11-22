// Qué se puede anotar en "Lo que tenés": todos los CEDEARs que cotizan en BYMA
// (cedears.ts, del listado oficial), acciones argentinas y bonos (locales.ts), cripto
// y algunas opciones genéricas (dólares, plazo fijo, otro).

import { CATALOGO_INSTRUMENTOS } from "@/lib/plataforma/instrumentos/catalogo";
import type { Categoria } from "@/lib/plataforma/tipos";
import { CEDEARS, type Cedear } from "./cedears";
import { ACCIONES_ARGENTINAS, BONOS_SOBERANOS } from "./locales";
import type { Tenencia, TipoActivo } from "./tipos";

/**
 * Precios de BYMA (acciones argentinas, bonos, CEDEARs en pesos).
 *
 * TODO-LICENCIA: mostrar precios de BYMA en un producto comercial requiere la licencia
 * de Market Data de BYMA (marketdata@byma.com.ar), venga de donde venga el dato. Hoy
 * están prendidos para desarrollar con una fuente gratuita (data912, ver
 * lib/mercado/byma.ts). Antes de lanzar: conseguir la licencia y cambiar la fuente, o
 * poner esto en false (todo vuelve a "lo anotás con el valor de tu app").
 */
export const PRECIOS_BYMA_ACTIVOS = true;

/** Prefijo de los símbolos de BYMA en /api/precios ("BYMA:GGAL"), para no mezclarlos con los de EE.UU. */
export const PREFIJO_BYMA = "BYMA:";

export interface OpcionActivo {
  /** Clave única de la opción (para el buscador). */
  clave: string;
  tipo: TipoActivo;
  simbolo: string | null;
  nombre: string;
  /** Qué es, en simple, para mostrar debajo del nombre. */
  detalle: string;
  categoria: Categoria;
  /** "Otro": la persona elige a qué parte de su plan se parece. */
  pideCategoria?: boolean;
  /** Se muestra antes de escribir nada en el buscador. */
  destacada?: boolean;
  /** Si se puede anotar por cantidad, cómo se llaman las unidades ("CEDEARs", "acciones", "nominales", "BTC"). */
  unidad?: string;
}

const CRIPTO: { simbolo: string; nombre: string }[] = [
  { simbolo: "BTC", nombre: "Bitcoin" },
  { simbolo: "ETH", nombre: "Ethereum" },
  { simbolo: "SOL", nombre: "Solana" },
];

/** Opciones genéricas: van primero porque son lo más común al empezar. */
const GENERICAS: OpcionActivo[] = [
  { clave: "plazo-fijo", tipo: "plazo-fijo", simbolo: null, nombre: "Plazo fijo", detalle: "En tu banco o billetera", categoria: "fija", destacada: true },
  {
    clave: "rinde-diario",
    tipo: "rinde-diario",
    simbolo: null,
    nombre: "Cuenta o fondo que rinde a diario",
    detalle: "Billetera, cuenta remunerada o FCI money market",
    categoria: "liquidez",
    destacada: true,
  },
  { clave: "dolares", tipo: "dolares", simbolo: null, nombre: "Dólares", detalle: "Billete o dólar MEP", categoria: "liquidez", destacada: true },
];

const DE_LA_BIBLIOTECA = new Map(CATALOGO_INSTRUMENTOS.map((i) => [i.ticker, i]));
const CEDEAR_POR_CODIGO = new Map<string, Cedear>(CEDEARS.map((c) => [c.byma, c]));

function opcionCedear(c: Cedear): OpcionActivo {
  const biblioteca = DE_LA_BIBLIOTECA.get(c.byma);
  return {
    clave: `cedear-${c.byma}`,
    // Si el activo original no cotiza en dólares en EE.UU., solo queda el precio de BYMA
    // (o, sin él, el valor que copia de su app).
    tipo: c.subyacente ? "cedear" : PRECIOS_BYMA_ACTIVOS ? "byma" : "manual",
    simbolo: c.byma,
    nombre: c.nombre,
    detalle: c.subyacente || PRECIOS_BYMA_ACTIVOS ? (c.etf ? "CEDEAR de un fondo (ETF)" : "CEDEAR de una empresa") : "CEDEAR · lo anotás con el valor de tu app",
    categoria: biblioteca?.categoriasCartera[0] ?? c.categoria,
    destacada: Boolean(biblioteca),
    unidad: "CEDEARs",
  };
}

export const OPCIONES_ACTIVO: readonly OpcionActivo[] = [
  ...GENERICAS,
  ...CEDEARS.map(opcionCedear),
  ...ACCIONES_ARGENTINAS.map<OpcionActivo>((a) => {
    const biblioteca = DE_LA_BIBLIOTECA.get(a.ticker);
    return {
      clave: `accion-${a.ticker}`,
      tipo: PRECIOS_BYMA_ACTIVOS ? "byma" : "manual",
      simbolo: a.ticker,
      nombre: a.nombre,
      detalle: PRECIOS_BYMA_ACTIVOS ? "Acción argentina" : "Acción argentina · lo anotás con el valor de tu app",
      categoria: biblioteca?.categoriasCartera[0] ?? "variable",
      destacada: Boolean(biblioteca),
      unidad: "acciones",
    };
  }),
  ...BONOS_SOBERANOS.map<OpcionActivo>((b) => ({
    clave: `bono-${b.ticker}`,
    tipo: PRECIOS_BYMA_ACTIVOS ? "byma" : "manual",
    simbolo: b.ticker,
    nombre: b.nombre,
    detalle: PRECIOS_BYMA_ACTIVOS ? "Bono · en pesos" : "Bono · lo anotás con el valor de tu app",
    categoria: "fija",
    destacada: DE_LA_BIBLIOTECA.has(b.ticker),
    // Con precio en vivo se puede anotar por nominales (el precio es cada 100).
    ...(PRECIOS_BYMA_ACTIVOS ? { unidad: "nominales" } : {}),
  })),
  // Bonos y ONs de la Biblioteca que no están en la lista de soberanos.
  ...CATALOGO_INSTRUMENTOS.filter((i) => i.categoria === "renta-fija" && !BONOS_SOBERANOS.some((b) => b.ticker === i.ticker)).map<OpcionActivo>((i) => ({
    clave: `bono-${i.ticker}`,
    tipo: "manual",
    simbolo: i.ticker,
    nombre: i.nombre,
    detalle: `${i.tipo} · lo anotás con el valor de tu app`,
    categoria: i.categoriasCartera[0],
    destacada: true,
  })),
  ...CRIPTO.map<OpcionActivo>((c) => ({
    clave: `cripto-${c.simbolo}`,
    tipo: "cripto",
    simbolo: c.simbolo,
    nombre: c.nombre,
    detalle: "Criptomoneda",
    categoria: "alternativo",
    destacada: c.simbolo !== "SOL",
    unidad: c.simbolo,
  })),
  { clave: "otro", tipo: "manual", simbolo: null, nombre: "Otro / no lo encuentro", detalle: "Lo anotás con el valor que ves en tu app", categoria: "variable", pideCategoria: true },
];

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Cuántos resultados mostrar como máximo: con más de 500 opciones, hay que escribir para afinar. */
export const MAX_RESULTADOS = 30;

/**
 * Busca por ticker o nombre, sin acentos. Primero el ticker exacto, después los que empiezan
 * con lo escrito y al final los que lo contienen. Sin texto devuelve las destacadas.
 * "Otro" siempre queda al final.
 */
export function buscarActivos(texto: string, opciones: readonly OpcionActivo[] = OPCIONES_ACTIVO, max = MAX_RESULTADOS): OpcionActivo[] {
  const q = normalizar(texto);
  const otro = opciones.filter((o) => o.clave === "otro");
  const resto = opciones.filter((o) => o.clave !== "otro");
  if (!q) return [...resto.filter((o) => o.destacada), ...otro];

  const puntaje = (o: OpcionActivo) => {
    const sym = normalizar(o.simbolo ?? "");
    const nombre = normalizar(o.nombre);
    if (sym === q) return 0;
    if (nombre === q) return 1;
    if (sym.startsWith(q)) return 2;
    if (nombre.startsWith(q) || nombre.split(/\s+/).some((p) => p.startsWith(q))) return 3;
    if (nombre.includes(q)) return 4;
    if (normalizar(o.detalle).includes(q)) return 5;
    return null;
  };
  const encontrados = resto
    .map((o) => ({ o, p: puntaje(o) }))
    .filter((x): x is { o: OpcionActivo; p: number } => x.p !== null)
    .sort((a, b) => a.p - b.p || Number(Boolean(b.o.destacada)) - Number(Boolean(a.o.destacada)) || a.o.nombre.localeCompare(b.o.nombre))
    .slice(0, max)
    .map((x) => x.o);
  return [...encontrados, ...otro];
}

/** Ratio del CEDEAR (cuántos CEDEARs equivalen a 1 acción original), según el listado de BYMA. */
export function ratioDe(codigoByma: string | null): number | null {
  if (!codigoByma) return null;
  return CEDEAR_POR_CODIGO.get(codigoByma)?.ratio ?? null;
}

/** El símbolo que se pide a la fuente de EE.UU. (activo original del CEDEAR o par cripto-USD). */
export function simboloMercado(t: Pick<Tenencia, "tipo" | "simbolo">): string | null {
  if (!t.simbolo) return null;
  if (t.tipo === "cedear") return CEDEAR_POR_CODIGO.get(t.simbolo)?.subyacente ?? null;
  if (t.tipo === "cripto") return `${t.simbolo}-USD`;
  return null;
}

export type ClaseByma = "accion" | "cedear" | "bono";

const CLASE_BYMA = new Map<string, ClaseByma>([
  ...CEDEARS.map((c) => [c.byma, "cedear"] as const),
  ...ACCIONES_ARGENTINAS.map((a) => [a.ticker, "accion"] as const),
  ...BONOS_SOBERANOS.map((b) => [b.ticker, "bono"] as const),
]);

/** Qué es un código de BYMA (acción, CEDEAR o bono). null si no está en nuestras listas. */
export function claseByma(codigo: string): ClaseByma | null {
  return CLASE_BYMA.get(codigo) ?? null;
}

/** El símbolo de BYMA que se pide a /api/precios ("BYMA:GGAL"). null si está apagado o no aplica. */
export function simboloByma(t: Pick<Tenencia, "tipo" | "simbolo">): string | null {
  if (!PRECIOS_BYMA_ACTIVOS || !t.simbolo) return null;
  if (t.tipo !== "byma" && t.tipo !== "cedear") return null;
  return CLASE_BYMA.has(t.simbolo) ? PREFIJO_BYMA + t.simbolo : null;
}

/** Todos los símbolos que hacen falta para valuar algo: el de BYMA primero, después el de EE.UU. */
export function simbolosPrecio(t: Pick<Tenencia, "tipo" | "simbolo">): string[] {
  return [simboloByma(t), simboloMercado(t)].filter((s): s is string => s !== null);
}

/**
 * Los bonos cotizan cada 100 nominales: el precio de UN nominal es el precio ÷ 100.
 * Acciones y CEDEARs cotizan por unidad.
 */
export function divisorPrecio(codigo: string | null): number {
  return codigo && CLASE_BYMA.get(codigo) === "bono" ? 100 : 1;
}

/**
 * Lista cerrada de símbolos que /api/precios acepta: activos de EE.UU., cripto y, si
 * PRECIOS_BYMA_ACTIVOS, los de BYMA de nuestras listas. Nada de índices (^).
 */
export const SIMBOLOS_PERMITIDOS: ReadonlySet<string> = new Set(OPCIONES_ACTIVO.flatMap((o) => simbolosPrecio(o)));

/** Nombre corto de cada parte del plan, para frases. */
export const NOMBRE_CORTO_CATEGORIA: Record<Categoria, string> = {
  fija: "bonos y plazos fijos",
  variable: "acciones",
  dividendos: "empresas que pagan dividendos",
  liquidez: "plata disponible",
  alternativo: "cripto y oro",
};
