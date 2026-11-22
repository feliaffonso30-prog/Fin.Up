// Series de precios de cierre diarios (solo servidor), para saber cuánto valía algo el
// día en que la persona lo compró.
//
// - BYMA (acciones, CEDEARs, bonos): data912, en ARS. TODO-LICENCIA: igual que los
//   precios del día (ver lib/mercado/byma.ts), requiere licencia de BYMA antes de lanzar.
// - EE.UU. y cripto: Yahoo, en USD.
// - Dólar MEP de cada día: ArgentinaDatos.
// Los cierres pasados no cambian: se cachean varias horas.

import type { ClaseByma } from "@/lib/plataforma/cartera-real/activos";
import { restarDias, type Cierre } from "@/lib/plataforma/cartera-real/historico";

const TIMEOUT_MS = 10_000;
const SEIS_HORAS = 6 * 60 * 60;

async function getJson<T>(url: string, revalidate = SEIS_HORAS): Promise<T> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "User-Agent": "Mozilla/5.0 FinUp" },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
  return res.json() as Promise<T>;
}

const PANEL_HISTORICO: Record<ClaseByma, string> = { accion: "stocks", cedear: "cedears", bono: "bonds" };

/** Cierres diarios en ARS de un código de BYMA (los bonos, cada 100 nominales). */
export async function serieByma(codigo: string, clase: ClaseByma): Promise<Cierre[]> {
  const filas = await getJson<{ date: string; c: number }[]>(`https://data912.com/historical/${PANEL_HISTORICO[clase]}/${encodeURIComponent(codigo)}`);
  return filas.filter((f) => typeof f.date === "string" && f.c > 0).map((f) => ({ fecha: f.date.slice(0, 10), cierre: f.c }));
}

interface YahooHistorico {
  chart: {
    result?: { meta: { currency: string }; timestamp?: number[]; indicators: { quote: { close: (number | null)[] }[] } }[];
  };
}

/** Cierres diarios en USD de un símbolo de Yahoo, de los días cercanos a la fecha. */
export async function serieYahoo(simbolo: string, fecha: string): Promise<Cierre[]> {
  return serieYahooEntre(simbolo, restarDias(fecha, 12), fecha);
}

/** Cierres diarios en USD de un símbolo de Yahoo entre dos fechas (AAAA-MM-DD). */
export async function serieYahooEntre(simbolo: string, desdeFecha: string, hastaFecha: string): Promise<Cierre[]> {
  const desde = Math.floor(Date.parse(`${desdeFecha}T00:00:00Z`) / 1000);
  const hasta = Math.floor(Date.parse(`${hastaFecha}T23:59:59Z`) / 1000);
  const d = await getJson<YahooHistorico>(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(simbolo)}?period1=${desde}&period2=${hasta}&interval=1d`,
  );
  const r = d.chart.result?.[0];
  if (!r || r.meta.currency !== "USD" || !r.timestamp) return [];
  const cierres = r.indicators.quote[0]?.close ?? [];
  return r.timestamp
    .map((t, i) => ({ fecha: new Date(t * 1000).toISOString().slice(0, 10), cierre: cierres[i] ?? 0 }))
    .filter((c) => c.cierre > 0);
}

/** Dólar MEP (venta) de cada día. */
export async function serieMep(): Promise<Cierre[]> {
  const filas = await getJson<{ venta: number | null; fecha: string }[]>("https://api.argentinadatos.com/v1/cotizaciones/dolares/bolsa");
  return filas.filter((f) => f.venta && f.venta > 0).map((f) => ({ fecha: f.fecha.slice(0, 10), cierre: f.venta as number }));
}
