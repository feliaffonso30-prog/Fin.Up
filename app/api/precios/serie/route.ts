// GET /api/precios/serie?desde=2026-03-02&simbolos=BYMA:AAPL,AAPL,BTC-USD
// → los cierres diarios de cada símbolo desde esa fecha (y unos días antes, para cubrir
// fines de semana) más el dólar MEP de cada día. Sirve para reconstruir "cómo vino tu
// plata" desde que compró.
//
// Misma lista cerrada que /api/precios. TODO-LICENCIA: los de BYMA (data912) requieren
// licencia de Market Data antes de lanzar.

import { NextResponse } from "next/server";
import { serieByma, serieMep, serieYahooEntre } from "@/lib/mercado/historico";
import { claseByma, PREFIJO_BYMA, SIMBOLOS_PERMITIDOS } from "@/lib/plataforma/cartera-real/activos";
import { restarDias, type Cierre } from "@/lib/plataforma/cartera-real/historico";

const MAX_SIMBOLOS = 20;

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const desde = params.get("desde") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || Number.isNaN(Date.parse(desde))) {
    return NextResponse.json({ error: "Fecha AAAA-MM-DD" }, { status: 400 });
  }
  const pedidos = [...new Set((params.get("simbolos") ?? "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean))];
  if (pedidos.length > MAX_SIMBOLOS || pedidos.some((s) => !SIMBOLOS_PERMITIDOS.has(s))) {
    return NextResponse.json({ error: "Símbolos no disponibles" }, { status: 400 });
  }

  const inicio = restarDias(desde, 12);
  const hoy = new Date().toISOString().slice(0, 10);
  const recortar = (serie: Cierre[]) => serie.filter((c) => c.fecha >= inicio);

  const [series, mep] = await Promise.all([
    Promise.allSettled(
      pedidos.map(async (s) => {
        if (s.startsWith(PREFIJO_BYMA)) {
          const codigo = s.slice(PREFIJO_BYMA.length);
          const clase = claseByma(codigo);
          return clase ? recortar(await serieByma(codigo, clase)) : [];
        }
        return serieYahooEntre(s, inicio, hoy);
      }),
    ),
    serieMep().catch(() => [] as Cierre[]),
  ]);

  const porSimbolo: Record<string, Cierre[]> = {};
  series.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value.length > 0) porSimbolo[pedidos[i]] = r.value;
  });

  return NextResponse.json(
    { desde, series: porSimbolo, mep: recortar(mep) },
    // Los cierres pasados no cambian; el de hoy se completa al cerrar el mercado.
    { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=21600" } },
  );
}
