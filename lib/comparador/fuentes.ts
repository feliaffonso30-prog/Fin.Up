// Datos del comparador (solo servidor): descarga de ArgentinaDatos y DolarAPI,
// caché de Next y respaldo ante fallas. El navegador nunca llama a las APIs
// externas: recibe lo que arma este módulo (vía la página o /api/comparador).
//
// Caché: `unstable_cache` guarda el resultado YA normalizado de cada fuente.
// - Se revalida en segundo plano cada `revalidar` segundos; mientras tanto se
//   sirve la copia anterior, así que una API lenta no frena la página.
// - Si la descarga falla o viene vacía, se tira error: Next no guarda nada y
//   sigue sirviendo la última copia buena, que `conRespaldo` marca como
//   desactualizada cuando pasa el doble del tiempo de revalidación.
// - El listado de FCI pesa ~30 MB: supera el límite de 2 MB de la caché de
//   `fetch`, por eso se baja con `no-store` y solo se cachea la lista reducida.

import { unstable_cache } from "next/cache";
import {
  normalizarBilleteras,
  normalizarDolarMep,
  normalizarFci,
  normalizarPlazoFijo,
  normalizarUva,
  recortarFci,
  ultimaInflacion,
  type DolarMep,
} from "@/lib/plataforma/comparador/normalizar";
import type { Alternativa, Inflacion } from "@/lib/plataforma/comparador/tipos";
import { conRespaldo, type Copia, type ResultadoFuente } from "./respaldo";

const AD = "https://api.argentinadatos.com/v1/finanzas";
export const URLS = {
  plazoFijo: `${AD}/tasas/plazoFijo`,
  uva: `${AD}/tasas/plazoFijoPrecancelable`,
  billeteras: `${AD}/rendimientos`,
  fci: `${AD}/fci/fondos`,
  inflacion: `${AD}/indices/inflacion`,
  dolarMep: "https://dolarapi.com/v1/dolares/bolsa",
};

// Subir este número cuando cambie la normalización, para no servir copias con la forma vieja.
const VERSION_CACHE = "3";

const HORA = 3600;

async function descargarUnaVez(url: string, timeoutMs: number): Promise<unknown> {
  const res = await fetch(url, {
    cache: "no-store", // la caché la maneja unstable_cache, sobre el dato ya normalizado
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: "application/json", "User-Agent": "FinUp/1.0 (comparador)" },
  });
  if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
  return res.json();
}

/** Un reintento ante cortes de red sueltos (no ante timeouts: ya esperamos bastante). */
async function descargarJson(url: string, timeoutMs = 10_000): Promise<unknown> {
  try {
    return await descargarUnaVez(url, timeoutMs);
  } catch (e) {
    if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) throw e;
    await new Promise((r) => setTimeout(r, 500));
    return descargarUnaVez(url, timeoutMs);
  }
}

/** AAAA-MM-DD de hoy en Argentina (para fuentes que no informan fecha). */
export function hoyEnArgentina(ahora = new Date()): string {
  return ahora.toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
}

function exigirLista<T>(lista: T[], fuente: string): T[] {
  if (lista.length === 0) throw new Error(`${fuente}: respuesta vacía o con un formato inesperado`);
  return lista;
}

function exigir<T>(valor: T | null, fuente: string): T {
  if (valor === null) throw new Error(`${fuente}: respuesta vacía o con un formato inesperado`);
  return valor;
}

// Última copia buena de cada fuente, en la memoria de este proceso del servidor.
// Es un segundo respaldo por si la caché de Next se vacía (ej. un deploy nuevo).
const ultimaBuena = new Map<string, Copia<unknown>>();

function fuente<T>(clave: string, revalidar: number, vacio: T, cargar: () => Promise<T>) {
  const cacheada = unstable_cache(
    async (): Promise<Copia<T>> => ({ datos: await cargar(), actualizadoEn: new Date().toISOString() }),
    ["comparador", clave, VERSION_CACHE],
    { revalidate: revalidar, tags: ["comparador", `comparador:${clave}`] },
  );
  return (): Promise<ResultadoFuente<T>> =>
    conRespaldo({
      clave,
      obtener: cacheada,
      vacio,
      edadMaximaMs: 2 * revalidar * 1000,
      ultimaBuena,
      registrarError: (c, e) => console.warn(`[comparador] falló la fuente "${c}":`, e instanceof Error ? e.message : e),
    });
}

export const obtenerPlazoFijo = fuente<Alternativa[]>("plazo-fijo", HORA, [], async () =>
  exigirLista(normalizarPlazoFijo(await descargarJson(URLS.plazoFijo), hoyEnArgentina()), "plazo fijo"),
);

export const obtenerUva = fuente<Alternativa[]>("uva", HORA, [], async () =>
  exigirLista(normalizarUva(await descargarJson(URLS.uva), hoyEnArgentina()), "plazo fijo UVA"),
);

export const obtenerBilleteras = fuente<Alternativa[]>("billeteras", HORA, [], async () =>
  exigirLista(normalizarBilleteras(await descargarJson(URLS.billeteras), hoyEnArgentina()), "billeteras"),
);

// Los FCI informan una vez por día hábil: alcanza con revisar cada 6 horas.
export const obtenerFci = fuente<Alternativa[]>("fci", 6 * HORA, [], async () =>
  exigirLista(recortarFci(normalizarFci(await descargarJson(URLS.fci, 60_000))), "FCI"),
);

// La inflación sale una vez por mes.
export const obtenerInflacion = fuente<Inflacion | null>("inflacion", 12 * HORA, null, async () =>
  exigir(ultimaInflacion(await descargarJson(URLS.inflacion)), "inflación"),
);

export const obtenerDolarMep = fuente<DolarMep | null>("dolar-mep", HORA, null, async () =>
  exigir(normalizarDolarMep(await descargarJson(URLS.dolarMep)), "dólar MEP"),
);

export interface DatosComparador {
  plazoFijo: ResultadoFuente<Alternativa[]>;
  uva: ResultadoFuente<Alternativa[]>;
  billeteras: ResultadoFuente<Alternativa[]>;
  fci: ResultadoFuente<Alternativa[]>;
  inflacion: ResultadoFuente<Inflacion | null>;
  dolarMep: ResultadoFuente<DolarMep | null>;
}

/** Todas las fuentes en paralelo. Nunca tira error: cada una informa su estado. */
export async function obtenerDatosComparador(): Promise<DatosComparador> {
  const [plazoFijo, uva, billeteras, fci, inflacion, dolarMep] = await Promise.all([
    obtenerPlazoFijo(),
    obtenerUva(),
    obtenerBilleteras(),
    obtenerFci(),
    obtenerInflacion(),
    obtenerDolarMep(),
  ]);
  return { plazoFijo, uva, billeteras, fci, inflacion, dolarMep };
}
