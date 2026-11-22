// GET /api/noticias?clave=GGAL → hasta 2 titulares recientes de medios confiables sobre
// esa inversión (titular, medio, fecha y link; no copiamos la nota).
//
// Solo acepta códigos de nuestras listas (OPCIONES_ACTIVO) y arma la búsqueda con el
// nombre: la persona no puede mandar texto libre.
//
// TODO-LICENCIA: la fuente es el RSS de Google Noticias, que permite solo uso personal y
// no comercial. Sirve para desarrollar. Antes de lanzar: una API de noticias con licencia
// comercial (o comunicados oficiales de las empresas / hechos relevantes de BYMA-CNV), o
// apagar NOTICIAS_ACTIVAS.

import { NextResponse } from "next/server";
import { OPCIONES_ACTIVO } from "@/lib/plataforma/cartera-real/activos";
import { nombreParaBuscar, NOTICIAS_ACTIVAS, parsearRss, type Noticia } from "@/lib/plataforma/cartera-real/noticias";

const NOMBRES = new Map(OPCIONES_ACTIVO.filter((o) => o.simbolo).map((o) => [o.simbolo as string, o]));

export async function GET(req: Request) {
  const clave = (new URL(req.url).searchParams.get("clave") ?? "").trim().toUpperCase();
  const opcion = NOMBRES.get(clave);
  if (!opcion) return NextResponse.json({ error: "Código no disponible" }, { status: 400 });
  if (!NOTICIAS_ACTIVAS) return NextResponse.json({ noticias: [] as Noticia[] });

  const nombre = nombreParaBuscar(opcion.nombre) || clave;
  const extra = opcion.tipo === "cripto" ? "" : opcion.categoria === "fija" ? " bono" : " acciones";
  const q = `"${nombre}"${extra} when:4d`;
  try {
    const res = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=es-419&gl=AR&ceid=AR:es-419`, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 FinUp" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) throw new Error(String(res.status));
    const noticias = parsearRss(await res.text(), new Date());
    return NextResponse.json({ noticias }, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
  } catch {
    // Sin noticias no pasa nada: el resumen se entiende igual.
    return NextResponse.json({ noticias: [] as Noticia[] });
  }
}
