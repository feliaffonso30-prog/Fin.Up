// GET /api/precios?simbolos=AAPL,BTC-USD,BYMA:GGAL → precios para "Lo que tenés".
//
// - Solo acepta la lista cerrada de SIMBOLOS_PERMITIDOS: activos originales de los
//   CEDEARs en Nueva York y cripto (Yahoo, en USD) y, con PRECIOS_BYMA_ACTIVOS, los de
//   BYMA con prefijo "BYMA:" (lib/mercado/byma.ts, en ARS). Nada de índices.
//   TODO-LICENCIA: los de BYMA requieren licencia de Market Data antes de lanzar.
// - Cada cotización se cachea 60 s en el servidor (fetch con revalidate en market.ts)
//   y la respuesta lleva s-maxage=60: con mil personas mirando, la fuente recibe como
//   mucho una consulta por símbolo por minuto.
// - Es un dato público (no lleva nada de la persona): no pide sesión.

import { NextResponse } from "next/server";
import { obtenerDolarMep } from "@/lib/comparador/fuentes";
import { obtenerCotizacion } from "@/lib/finbot/market";
import { obtenerPreciosByma } from "@/lib/mercado/byma";
import { claseByma, PREFIJO_BYMA, SIMBOLOS_PERMITIDOS, type ClaseByma } from "@/lib/plataforma/cartera-real/activos";
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

  const deByma = pedidos
    .filter((s) => s.startsWith(PREFIJO_BYMA))
    .map((s) => ({ simbolo: s, codigo: s.slice(PREFIJO_BYMA.length), clase: claseByma(s.slice(PREFIJO_BYMA.length)) }))
    .filter((p): p is { simbolo: string; codigo: string; clase: ClaseByma } => p.clase !== null);
  const deAfuera = pedidos.filter((s) => !s.startsWith(PREFIJO_BYMA));

  const consultado = new Date().toISOString();
  const [cotizaciones, preciosByma, mep] = await Promise.all([
    Promise.allSettled(deAfuera.map((s) => obtenerCotizacion(s))),
    deByma.length > 0 ? obtenerPreciosByma(deByma).catch(() => new Map()) : Promise.resolve(new Map()),
    obtenerDolarMep(),
  ]);

  const precios: PrecioMercado[] = [];
  const fallidos: string[] = [];
  cotizaciones.forEach((r, i) => {
    // De afuera, solo precios en dólares: es lo que espera la valuación.
    if (r.status === "fulfilled" && r.value.moneda === "USD" && r.value.precio > 0) {
      precios.push({
        simbolo: deAfuera[i],
        precio: r.value.precio,
        moneda: "USD",
        variacionDiaPct: r.value.variacionDiaPct,
        actualizado: r.value.actualizado,
        fuente: "Yahoo Finance",
      });
    } else {
      fallidos.push(deAfuera[i]);
    }
  });
  for (const p of deByma) {
    const b = preciosByma.get(p.codigo);
    if (!b) {
      fallidos.push(p.simbolo);
      continue;
    }
    // La fuente no da la hora de la última operación: usamos la de la consulta.
    precios.push({ simbolo: p.simbolo, precio: b.precio, moneda: "ARS", variacionDiaPct: b.variacionDiaPct, actualizado: consultado, fuente: "BYMA (vía data912)" });
  }

  return NextResponse.json(
    {
      precios,
      fallidos,
      mep: mep.datos ? { venta: mep.datos.venta, fecha: mep.datos.fecha } : null,
      consultado,
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
