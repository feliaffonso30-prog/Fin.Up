// Qué se puede anotar en "Lo que tenés": los instrumentos de la Biblioteca más
// algunas opciones genéricas (dólares, plazo fijo, cripto, otro).

import { CATALOGO_INSTRUMENTOS } from "@/lib/plataforma/instrumentos/catalogo";
import type { Categoria } from "@/lib/plataforma/tipos";
import type { Tenencia, TipoActivo } from "./tipos";

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
}

const CRIPTO: { simbolo: string; nombre: string }[] = [
  { simbolo: "BTC", nombre: "Bitcoin" },
  { simbolo: "ETH", nombre: "Ethereum" },
];

/** Opciones genéricas: van primero en el buscador porque son lo más común al empezar. */
const GENERICAS: OpcionActivo[] = [
  { clave: "plazo-fijo", tipo: "plazo-fijo", simbolo: null, nombre: "Plazo fijo", detalle: "En tu banco o billetera", categoria: "fija" },
  {
    clave: "rinde-diario",
    tipo: "rinde-diario",
    simbolo: null,
    nombre: "Cuenta o fondo que rinde a diario",
    detalle: "Billetera, cuenta remunerada o FCI money market",
    categoria: "liquidez",
  },
  { clave: "dolares", tipo: "dolares", simbolo: null, nombre: "Dólares", detalle: "Billete o dólar MEP", categoria: "liquidez" },
];

const TIPO_POR_INSTRUMENTO = (tipo: string): TipoActivo => (tipo.startsWith("CEDEAR") ? "cedear" : "manual");

export const OPCIONES_ACTIVO: readonly OpcionActivo[] = [
  ...GENERICAS,
  ...CATALOGO_INSTRUMENTOS.map<OpcionActivo>((i) => ({
    clave: `inst-${i.ticker}`,
    tipo: TIPO_POR_INSTRUMENTO(i.tipo),
    simbolo: i.ticker,
    nombre: i.nombre,
    detalle: i.tipo,
    categoria: i.categoriasCartera[0],
  })),
  ...CRIPTO.map<OpcionActivo>((c) => ({
    clave: `cripto-${c.simbolo}`,
    tipo: "cripto",
    simbolo: c.simbolo,
    nombre: c.nombre,
    detalle: "Criptomoneda",
    categoria: "alternativo",
  })),
  { clave: "otro", tipo: "manual", simbolo: null, nombre: "Otro / no lo encuentro", detalle: "Lo anotás con el valor que ves en tu app", categoria: "variable", pideCategoria: true },
];

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Busca por nombre, ticker o tipo. Sin texto devuelve todo. "Otro" siempre queda al final. */
export function buscarActivos(texto: string, opciones: readonly OpcionActivo[] = OPCIONES_ACTIVO): OpcionActivo[] {
  const q = normalizar(texto);
  if (!q) return [...opciones];
  const otro = opciones.filter((o) => o.clave === "otro");
  const resto = opciones.filter(
    (o) => o.clave !== "otro" && [o.nombre, o.simbolo ?? "", o.detalle].some((campo) => normalizar(campo).includes(q)),
  );
  return [...resto, ...otro];
}

/** Ratio del CEDEAR (cuántos CEDEARs equivalen a 1 acción original), según la Biblioteca. */
export function ratioDe(ticker: string | null): number | null {
  if (!ticker) return null;
  return CATALOGO_INSTRUMENTOS.find((i) => i.ticker === ticker)?.ratio ?? null;
}

/** El símbolo que se pide a la fuente de precios (activo original en Nueva York o par cripto-USD). */
export function simboloMercado(t: Pick<Tenencia, "tipo" | "simbolo">): string | null {
  if (!t.simbolo) return null;
  if (t.tipo === "cedear") return t.simbolo;
  if (t.tipo === "cripto") return `${t.simbolo}-USD`;
  return null;
}

/**
 * Lista cerrada de símbolos que /api/precios acepta: solo mercados de afuera y cripto.
 * Nada de símbolos de BYMA (.BA) ni índices (^): sin licencia no se muestran.
 */
export const SIMBOLOS_PERMITIDOS: ReadonlySet<string> = new Set(
  OPCIONES_ACTIVO.map((o) => simboloMercado(o)).filter((s): s is string => s !== null),
);

/** Nombre corto de cada parte del plan, para frases. */
export const NOMBRE_CORTO_CATEGORIA: Record<Categoria, string> = {
  fija: "préstamos (renta fija)",
  variable: "acciones",
  dividendos: "empresas que pagan dividendos",
  liquidez: "plata disponible",
  alternativo: "cripto y oro",
};
