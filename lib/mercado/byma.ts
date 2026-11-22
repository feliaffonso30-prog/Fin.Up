// Precios de BYMA en pesos (acciones argentinas, CEDEARs y bonos). Solo servidor.
//
// Fuente actual: data912 (https://data912.com), API pública y gratuita que trae de UN
// pedido todos los precios de cada panel. La usamos para desarrollar.
//
// TODO-LICENCIA: mostrar precios de BYMA en un producto comercial requiere la licencia
// de Market Data de BYMA (marketdata@byma.com.ar), venga de donde venga el dato. Al
// conseguirla, reemplazar `obtenerPanel` por la fuente licenciada: el resto de la app
// no cambia (solo usa `obtenerPreciosByma`). Para apagarlo: PRECIOS_BYMA_ACTIVOS.

import type { ClaseByma } from "@/lib/plataforma/cartera-real/activos";

const TIMEOUT_MS = 8000;
const BASE = "https://data912.com/live";

/** Qué panel de data912 tiene cada clase de activo. */
const PANEL: Record<ClaseByma, string> = {
  accion: "arg_stocks",
  cedear: "arg_cedears",
  bono: "arg_bonds",
};

interface FilaData912 {
  symbol: string;
  /** Último precio operado. */
  c: number;
  px_bid?: number;
  px_ask?: number;
  pct_change?: number | null;
}

export interface PrecioByma {
  codigo: string;
  /** En pesos. Los bonos, cada 100 nominales. */
  precio: number;
  variacionDiaPct: number | null;
}

async function obtenerPanel(clase: ClaseByma): Promise<Map<string, PrecioByma>> {
  const res = await fetch(`${BASE}/${PANEL[clase]}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "User-Agent": "Mozilla/5.0 FinUp" },
    // Un pedido por panel por minuto, no importa cuánta gente mire.
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`data912 ${PANEL[clase]} respondió ${res.status}`);
  const filas = (await res.json()) as FilaData912[];
  const mapa = new Map<string, PrecioByma>();
  for (const f of filas) {
    if (typeof f.symbol !== "string") continue;
    // Si hoy todavía no operó, el punto medio entre la mejor compra y la mejor venta.
    const medio = f.px_bid && f.px_ask ? (f.px_bid + f.px_ask) / 2 : 0;
    const precio = f.c > 0 ? f.c : medio;
    if (!(precio > 0)) continue;
    mapa.set(f.symbol.toUpperCase(), {
      codigo: f.symbol.toUpperCase(),
      precio,
      variacionDiaPct: typeof f.pct_change === "number" && Number.isFinite(f.pct_change) ? f.pct_change : null,
    });
  }
  return mapa;
}

/**
 * Precios de los códigos pedidos, agrupados por clase. Lo que no se encuentra (o el
 * panel que falla) simplemente no vuelve: quien llama lo marca como fallido.
 */
export async function obtenerPreciosByma(pedidos: { codigo: string; clase: ClaseByma }[]): Promise<Map<string, PrecioByma>> {
  const clases = [...new Set(pedidos.map((p) => p.clase))];
  const paneles = await Promise.allSettled(clases.map((c) => obtenerPanel(c)));
  const porClase = new Map<ClaseByma, Map<string, PrecioByma>>();
  paneles.forEach((r, i) => {
    if (r.status === "fulfilled") porClase.set(clases[i], r.value);
  });
  const res = new Map<string, PrecioByma>();
  for (const p of pedidos) {
    const precio = porClase.get(p.clase)?.get(p.codigo);
    if (precio) res.set(p.codigo, precio);
  }
  return res;
}
