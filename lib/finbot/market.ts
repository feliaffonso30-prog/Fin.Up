// Datos de mercado en tiempo real para FinBot (solo servidor).
// Todas las fuentes son públicas y sin API key, ideales para la demo.
// Si alguna se cae o cambia, se reemplaza acá sin tocar el chat.

const TIMEOUT_MS = 6000;

async function getJson<T>(url: string, revalidate = 60): Promise<T> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "User-Agent": "Mozilla/5.0 FinUp-Demo" },
    next: { revalidate }, // cache de Next: no golpeamos la API en cada mensaje
  });
  if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
  return res.json() as Promise<T>;
}

// ---------- Cotizaciones (acciones, CEDEARs, ETFs, índices, cripto) ----------
// Yahoo Finance (endpoint público). Convenciones de símbolos:
//   AAPL / SPY        -> Wall Street, en USD
//   AAPL.BA / GGAL.BA -> BYMA (CEDEARs y acciones argentinas), en ARS
//   ^MERV / ^GSPC     -> índices Merval / S&P 500
//   BTC-USD           -> cripto

interface YahooChart {
  chart: {
    result?: {
      meta: {
        symbol: string;
        currency: string;
        regularMarketPrice: number;
        chartPreviousClose?: number;
        longName?: string;
        shortName?: string;
        exchangeName?: string;
        regularMarketTime?: number;
      };
      indicators: { quote: { close: (number | null)[] }[] };
    }[];
    error?: { description: string } | null;
  };
}

export interface Cotizacion {
  simbolo: string;
  nombre: string;
  mercado: string;
  moneda: string;
  precio: number;
  precioTexto: string; // ya formateado (ej. "7.666,45") para que el modelo lo copie sin errores
  variacionDiaPct: number | null;
  variacionMesPct: number | null;
  actualizado: string | null;
}

const pct = (actual: number, previo?: number | null) =>
  previo ? Number((((actual - previo) / previo) * 100).toFixed(2)) : null;

export async function obtenerCotizacion(simbolo: string): Promise<Cotizacion> {
  const sym = encodeURIComponent(simbolo.trim().toUpperCase());
  const data = await getJson<YahooChart>(
    `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=1mo&interval=1d`,
  );
  const r = data.chart.result?.[0];
  if (!r) throw new Error(data.chart.error?.description ?? `No encontré el símbolo ${simbolo}`);

  const cierres = r.indicators.quote[0]?.close.filter((c): c is number => c != null) ?? [];
  const m = r.meta;
  return {
    simbolo: m.symbol,
    nombre: m.longName ?? m.shortName ?? m.symbol,
    mercado: m.exchangeName ?? "",
    moneda: m.currency || "puntos", // los índices no tienen moneda
    precio: m.regularMarketPrice,
    precioTexto: m.regularMarketPrice.toLocaleString("es-AR", { maximumFractionDigits: 2 }),
    variacionDiaPct: pct(m.regularMarketPrice, cierres.at(-2) ?? m.chartPreviousClose),
    variacionMesPct: pct(m.regularMarketPrice, cierres[0]),
    actualizado: m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : null,
  };
}

// ---------- Indicadores argentinos ----------
// dolarapi.com y argentinadatos.com: APIs abiertas de la comunidad.

interface DolarApi {
  nombre: string;
  compra: number | null;
  venta: number | null;
  fechaActualizacion: string;
}

export async function obtenerDolares() {
  const lista = await getJson<DolarApi[]>("https://dolarapi.com/v1/dolares");
  return lista.map(({ nombre, compra, venta, fechaActualizacion }) => ({
    tipo: nombre,
    compra,
    venta,
    actualizado: fechaActualizacion,
  }));
}

export async function obtenerRiesgoPais() {
  const r = await getJson<{ valor: number; fecha: string }>(
    "https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo",
  );
  return { puntosBasicos: r.valor, fecha: r.fecha };
}

export async function obtenerInflacion() {
  const serie = await getJson<{ fecha: string; valor: number }[]>(
    "https://api.argentinadatos.com/v1/finanzas/indices/inflacion",
    3600,
  );
  return serie.slice(-6).map((p) => ({ mes: p.fecha.slice(0, 7), inflacionMensualPct: p.valor }));
}

export type Indicador = "dolar" | "riesgo_pais" | "inflacion" | "merval" | "sp500";

export async function obtenerIndicador(indicador: Indicador) {
  switch (indicador) {
    case "dolar":
      return obtenerDolares();
    case "riesgo_pais":
      return obtenerRiesgoPais();
    case "inflacion":
      return obtenerInflacion();
    case "merval":
      return obtenerCotizacion("^MERV");
    case "sp500":
      return obtenerCotizacion("^GSPC");
  }
}
