// GET /api/dolar-mep: la cotización con la que el cuestionario pasa pesos a dólares.
// Es un dato público, por eso no pide sesión y queda fuera del proxy como el resto de /api.

import { NextResponse } from "next/server";
import { obtenerDolarMep } from "@/lib/comparador/fuentes";

export async function GET() {
  const { datos } = await obtenerDolarMep();
  if (!datos) return NextResponse.json({ error: "Cotización no disponible" }, { status: 503 });
  return NextResponse.json(
    { venta: datos.venta, fecha: datos.fecha },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
