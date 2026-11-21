// GET /api/precios?simbolos=AAPL,BTC-USD → precios en USD para "Lo que tenés".
//
// - Solo acepta la lista cerrada de SIMBOLOS_PERMITIDOS (activos originales de los
//   CEDEARs en Nueva York y cripto). Nada de BYMA (.BA) ni índices: sin licencia de
//   Market Data no se muestran.
// - Cada cotización se cachea 60 s en el servidor (fetch con revalidate en market.ts)
//   y la respuesta lleva s-maxage=60: con mil personas mirando, la fuente recibe como
//   mucho una consulta por símbolo por minuto.
// - Es un dato público (no lleva nada de la persona): no pide sesión.

import { NextResponse } from "next/server";
import { obtenerDolarMep } from "@/lib/comparador/fuentes";
import { obtenerCotizacion } from "@/lib/finbot/market";
import { SIMBOLOS_PERMITIDOS } from "@/lib/plataforma/cartera-real/activos";
import type { PrecioMercado } from "@/lib/plataforma/cartera-real/tipos";

const MAX_SIMBOLOS = 20;

export async function GET(req: Request) {
  const crudo = new URL(req.url).searchParams.get("simbolos") ?? "";
  const pedidos = [...new Set(crudo.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean))];
  if (pedidos.length > MAX_SIMBOLOS) {
    return NextResponse.json({ error: `Pedí hasta ${MAX_SIMBOLOS} símbolos por vez.` }, { status: 400 });
  }
  const noPermitidos = pedidos.filter((s) => !SIMBOLOS_PERMITIDOS.has(s));
  if (noPermitidos.length > 0) {
    return NextResponse.json({ error: `Símbolos no disponibles: ${noPermitidos.join(", ")}` }, { status: 400 });
  }

  const [cotizaciones, mep] = await Promise.all([
    Promise.allSettled(pedidos.map((s) => obtenerCotizacion(s))),
    obtenerDolarMep(),
  ]);

  const precios: PrecioMercado[] = [];
  const fallidos: string[] = [];
  cotizaciones.forEach((r, i) => {
    // Solo precios en dólares: es lo que espera la valuación.
    if (r.status === "fulfilled" && r.value.moneda === "USD" && r.value.precio > 0) {
      precios.push({
        simbolo: pedidos[i],
        precioUsd: r.value.precio,
        variacionDiaPct: r.value.variacionDiaPct,
        actualizado: r.value.actualizado,
        fuente: "Yahoo Finance",
      });
    } else {
      fallidos.push(pedidos[i]);
    }
  });

  return NextResponse.json(
    {
      precios,
      fallidos,
      mep: mep.datos ? { venta: mep.datos.venta, fecha: mep.datos.fecha } : null,
      consultado: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
