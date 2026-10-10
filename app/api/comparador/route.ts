// GET /api/comparador: tasas y rendimientos normalizados para el comparador.
// Son datos públicos (no dependen del usuario), por eso no pide sesión y queda
// fuera del proxy como el resto de /api. La página /comparador no pasa por acá
// (lee lib/comparador/fuentes.ts directo); esto queda para FinBot o una app.

import { NextResponse } from "next/server";
import { obtenerDatosComparador } from "@/lib/comparador/fuentes";

export async function GET() {
  const datos = await obtenerDatosComparador();
  return NextResponse.json(datos, {
    headers: {
      // CDN: 5 minutos fresco y hasta 1 hora sirviendo la copia vieja mientras se renueva.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
