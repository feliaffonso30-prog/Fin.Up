// GET /api/precios/historico?fecha=2026-03-02&simbolos=BYMA:AAPL,AAPL
// → el cierre de cada símbolo ese día (o el último día hábil anterior) y el dólar MEP
// de ese día. Sirve para calcular lo que puso la persona a partir de la fecha en que
// compró, sin que tenga que saber el precio.
//
// Misma lista cerrada que /api/precios (SIMBOLOS_PERMITIDOS). Sin símbolos devuelve
// solo el MEP de ese día. TODO-LICENCIA: los de BYMA requieren licencia antes de lanzar.

import { NextResponse } from "next/server";
import { serieByma, serieMep, serieYahoo } from "@/lib/mercado/historico";
import { claseByma, PREFIJO_BYMA, SIMBOLOS_PERMITIDOS } from "@/lib/plataforma/cartera-real/activos";
import { cierreEnFecha, type Cierre } from "@/lib/plataforma/cartera-real/historico";
import type { PrecioMercado } from "@/lib/plataforma/cartera-real/tipos";

const MAX_SIMBOLOS = 4;

async function serieDe(simbolo: string, fecha: string): Promise<{ serie: Cierre[]; moneda: "ARS" | "USD"; fuente: string }> {
  if (simbolo.startsWith(PREFIJO_BYMA)) {
    const codigo = simbolo.slice(PREFIJO_BYMA.length);
    const clase = claseByma(codigo);
    if (!clase) throw new Error("Sin clase");
    return { serie: await serieByma(codigo, clase), moneda: "ARS", fuente: "BYMA (vía data912)" };
  }
  return { serie: await serieYahoo(simbolo, fecha), moneda: "USD", fuente: "Yahoo Finance" };
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const fecha = params.get("fecha") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha))) {
    return NextResponse.json({ error: "Fecha AAAA-MM-DD" }, { status: 400 });
  }
  const pedidos = [...new Set((params.get("simbolos") ?? "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean))];
  if (pedidos.length > MAX_SIMBOLOS || pedidos.some((s) => !SIMBOLOS_PERMITIDOS.has(s))) {
    return NextResponse.json({ error: "Símbolos no disponibles" }, { status: 400 });
  }

  const [series, mep] = await Promise.all([Promise.allSettled(pedidos.map((s) => serieDe(s, fecha))), serieMep().catch(() => [] as Cierre[])]);

  const precios: (PrecioMercado & { fecha: string })[] = [];
  series.forEach((r, i) => {
    if (r.status !== "fulfilled") return;
    const c = cierreEnFecha(r.value.serie, fecha);
    if (!c) return;
    precios.push({ simbolo: pedidos[i], precio: c.cierre, moneda: r.value.moneda, variacionDiaPct: null, actualizado: c.fecha, fuente: r.value.fuente, fecha: c.fecha });
  });
  const mepDia = cierreEnFecha(mep, fecha);

  return NextResponse.json(
    { fecha, precios, mep: mepDia ? { venta: mepDia.cierre, fecha: mepDia.fecha } : null },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
