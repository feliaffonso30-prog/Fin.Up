// Noticias relacionadas con lo que más se movió: solo el titular, el medio, la fecha y
// el link a la nota (no copiamos el contenido). Puro: el texto del RSS llega de afuera
// (lib/mercado/noticias.ts).
//
// Una noticia "relacionada" no quiere decir que explique el movimiento: la pantalla lo
// aclara y el por qué posible queda para FinBot.

/**
 * TODO-LICENCIA: la fuente de /api/noticias es el RSS de Google Noticias, que permite
 * solo uso personal y no comercial. Antes de lanzar: una fuente con licencia comercial,
 * o poner esto en false (el resumen se muestra igual, sin noticias).
 */
export const NOTICIAS_ACTIVAS = true;

export interface Noticia {
  titulo: string;
  medio: string;
  /** ISO */
  fecha: string;
  link: string;
}

/** Cuántas noticias mostramos como mucho: sencillo, sin exceso de info. */
export const MAX_NOTICIAS = 2;

/**
 * Medios conocidos y serios. Si una nota no es de uno de estos, no se muestra: mejor
 * nada que un blog o un sitio de "señales".
 */
export const MEDIOS_CONFIABLES = [
  "ambito",
  "infobae",
  "la nacion",
  "clarin",
  "el cronista",
  "iprofesional",
  "bloomberg linea",
  "bloomberg",
  "reuters",
  "perfil",
  "el economista",
  "forbes",
  "bae negocios",
  "pagina/12",
  "pagina 12",
  "noticias argentinas",
  "telam",
  "la voz",
  "cnn en espanol",
  "bbc",
  "el pais",
  "expansion",
  "investing.com",
  "criptonoticias",
  "cointelegraph",
] as const;

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export function esMedioConfiable(medio: string): boolean {
  const m = normalizar(medio);
  return MEDIOS_CONFIABLES.some((c) => m === c || m.startsWith(`${c} `) || m.includes(c));
}

/** "Apple Inc." → "Apple"; "Grupo Financiero Galicia" → "Grupo Financiero Galicia". */
export function nombreParaBuscar(nombre: string): string {
  return nombre
    .replace(/\(.*?\)/g, "")
    .replace(/\b(inc|corp|corporation|co|ltd|plc|s\.?a\.?|n\.?v\.?|ag|se|holdings?|group|company|the|class [a-z]|adr|etf|trust)\b\.?/gi, "")
    .replace(/[,.]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const entidades: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&lt;": "<", "&gt;": ">" };
const decodificar = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&(amp|quot|#39|apos|lt|gt);/g, (e) => entidades[e] ?? e);

/**
 * Lee un RSS (formato Google Noticias): titular sin el " - Medio" del final, medio,
 * fecha y link. Solo de medios confiables, de los últimos `dias`, los más nuevos primero.
 */
export function parsearRss(xml: string, ahora: Date, dias = 4, max = MAX_NOTICIAS): Noticia[] {
  const limite = ahora.getTime() - dias * 86_400_000;
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const vistas = new Set<string>();
  const res: Noticia[] = [];
  for (const it of items) {
    const tag = (n: string) => decodificar(it.match(new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`))?.[1] ?? "").trim();
    const medio = tag("source");
    const link = tag("link");
    const fecha = Date.parse(tag("pubDate"));
    let titulo = tag("title");
    if (medio && titulo.endsWith(` - ${medio}`)) titulo = titulo.slice(0, -(medio.length + 3));
    if (!titulo || !medio || !/^https:\/\//.test(link) || !Number.isFinite(fecha)) continue;
    if (fecha < limite || !esMedioConfiable(medio)) continue;
    const clave = normalizar(titulo);
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    res.push({ titulo, medio, fecha: new Date(fecha).toISOString(), link });
  }
  return res.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, max);
}
