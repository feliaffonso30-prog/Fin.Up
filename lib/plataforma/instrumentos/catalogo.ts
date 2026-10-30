// Acceso a la Biblioteca de instrumentos: carga validada, búsqueda, filtros y
// ejemplos para la cartera. Puro (sin React ni red).

import type { Categoria, PerfilRiesgo } from "../tipos";
import { INSTRUMENTOS } from "./datos";
import {
  instrumentoSchema,
  type CategoriaInstrumento,
  type Instrumento,
  type Moneda,
  type NivelRiesgo,
} from "./tipos";

export interface ResultadoCarga {
  instrumentos: Instrumento[];
  errores: string[]; // uno por instrumento descartado, para revisar en consola o en tests
}

/**
 * Valida cada instrumento por separado: uno mal cargado se descarta y el resto
 * se muestra igual. También descarta tickers repetidos (se queda con el primero).
 */
export function cargarInstrumentos(crudos: unknown[]): ResultadoCarga {
  const instrumentos: Instrumento[] = [];
  const errores: string[] = [];
  const vistos = new Set<string>();

  crudos.forEach((crudo, i) => {
    const r = instrumentoSchema.safeParse(crudo);
    const nombre = (crudo as { ticker?: unknown })?.ticker ?? `#${i}`;
    if (!r.success) {
      errores.push(`${String(nombre)}: ${r.error.issues.map((x) => `${x.path.join(".")} ${x.message}`).join("; ")}`);
      return;
    }
    if (vistos.has(r.data.ticker)) {
      errores.push(`${r.data.ticker}: ticker repetido`);
      return;
    }
    vistos.add(r.data.ticker);
    instrumentos.push(r.data);
  });

  return { instrumentos, errores };
}

const carga = cargarInstrumentos(INSTRUMENTOS);
if (carga.errores.length > 0 && process.env.NODE_ENV !== "production") {
  console.warn(`[instrumentos] Se descartaron ${carga.errores.length} instrumentos:\n${carga.errores.join("\n")}`);
}

/** La lista validada, en el orden de datos.ts. */
export const CATALOGO_INSTRUMENTOS: readonly Instrumento[] = carga.instrumentos;

/** Busca por ticker sin distinguir mayúsculas ("spy" encuentra SPY). */
export function porTicker(ticker: string, lista: readonly Instrumento[] = CATALOGO_INSTRUMENTOS): Instrumento | null {
  let t = ticker;
  try {
    t = decodeURIComponent(ticker);
  } catch {
    /* "%" suelto en la URL: se busca tal cual y no va a coincidir */
  }
  t = t.trim().toUpperCase();
  return lista.find((i) => i.ticker === t) ?? null;
}

// ---------- Búsqueda y filtros ----------

export interface Filtros {
  texto?: string;
  categoria?: CategoriaInstrumento | "todas";
  riesgo?: NivelRiesgo | "todos";
  moneda?: Moneda | "todas";
}

// Sin tildes y en minúsculas, para que "energia" encuentre "Energía".
const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export function filtrar(lista: readonly Instrumento[], f: Filtros): Instrumento[] {
  const texto = f.texto ? normalizar(f.texto) : "";
  return lista.filter(
    (i) =>
      (!texto || normalizar(`${i.ticker} ${i.nombre} ${i.sector}`).includes(texto)) &&
      (!f.categoria || f.categoria === "todas" || i.categoria === f.categoria) &&
      (!f.riesgo || f.riesgo === "todos" || i.riesgo === f.riesgo) &&
      (!f.moneda || f.moneda === "todas" || i.monedas.includes(f.moneda)),
  );
}

// ---------- Conexión con la cartera ----------

const ORDEN_RIESGO: Record<NivelRiesgo, number> = { bajo: 0, medio: 1, alto: 2 };
// El nivel de riesgo de la lista que corresponde a cada perfil.
const RIESGO_DEL_PERFIL: Record<PerfilRiesgo, number> = { Conservador: 0, Moderado: 1, Agresivo: 2 };

/** Categorías de la cartera que muestran "Ver ejemplos" (liquidez va al comparador; alternativos todavía no). */
export const CATEGORIAS_CON_EJEMPLOS: readonly Categoria[] = ["variable", "dividendos", "fija"];

/**
 * Hasta `max` instrumentos de esa categoría de la cartera que sirven de ejemplo
 * para el perfil. Primero los de riesgo igual al del perfil, después los más
 * cercanos (ante empate, el menos riesgoso). Además alterna tipos (ETF, empresa,
 * acción local) para que los ejemplos muestren la variedad de la categoría.
 */
export function ejemplosPara(
  categoria: Categoria,
  perfil: PerfilRiesgo,
  max = 5,
  lista: readonly Instrumento[] = CATALOGO_INSTRUMENTOS,
): Instrumento[] {
  if (!CATEGORIAS_CON_EJEMPLOS.includes(categoria)) return [];
  const candidatos = lista
    .filter((i) => i.categoriasCartera.includes(categoria) && i.perfilesEjemplo.includes(perfil))
    .map((i, orden) => ({ i, orden }))
    .sort((a, b) => {
      const objetivo = RIESGO_DEL_PERFIL[perfil];
      const distancia = (x: Instrumento) => Math.abs(ORDEN_RIESGO[x.riesgo] - objetivo);
      return distancia(a.i) - distancia(b.i) || ORDEN_RIESGO[a.i.riesgo] - ORDEN_RIESGO[b.i.riesgo] || a.orden - b.orden;
    })
    .map(({ i }) => i);

  // Reparto por turnos entre categorías de instrumento, respetando el orden por riesgo.
  const grupos = new Map<CategoriaInstrumento, Instrumento[]>();
  for (const i of candidatos) grupos.set(i.categoria, [...(grupos.get(i.categoria) ?? []), i]);
  const resultado: Instrumento[] = [];
  while (resultado.length < max && [...grupos.values()].some((g) => g.length > 0)) {
    for (const g of grupos.values()) {
      const siguiente = g.shift();
      if (siguiente && resultado.length < max) resultado.push(siguiente);
    }
  }
  return resultado;
}
