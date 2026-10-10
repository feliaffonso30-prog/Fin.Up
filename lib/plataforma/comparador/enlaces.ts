// Mapa entidad → link del botón "Ir a la entidad". Lo completan los fundadores.
//
// - La clave es el nombre de la entidad tal como viene de la API; se compara sin
//   importar mayúsculas, acentos ni "S.A." (ver `claveEntidad`).
// - Si una entidad no está acá, se usa el link que informa la API (si hay).
// - Si algún día un link es de referido, marcarlo con `esReferido: true`: la UI
//   lo tiene que mostrar como tal.

export interface Enlace {
  url: string;
  esReferido?: boolean;
}

export const ENLACES: Record<string, Enlace> = {
  // Ejemplos (completar):
  // "Banco de la Nación Argentina": { url: "https://www.bna.com.ar/Personas/PlazoFijo" },
  // "UALA": { url: "https://www.uala.com.ar/inversiones/plazo-fijo" },
};

export function claveEntidad(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\bS\.?\s?A\.?(?=\s|$)|\bSOCIEDAD ANONIMA\b/g, "")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const INDICE = new Map(Object.entries(ENLACES).map(([k, v]) => [claveEntidad(k), v]));

/** Link propio si está cargado; si no, el de la API. Nunca devuelve algo que no sea http(s). */
export function buscarEnlace(
  entidad: string,
  enlaceApi: string | null | undefined,
  mapa: Map<string, Enlace> = INDICE,
): { url: string | null; esReferido: boolean } {
  const propio = mapa.get(claveEntidad(entidad));
  const url = (propio?.url ?? enlaceApi ?? "").trim();
  if (!/^https?:\/\//i.test(url)) return { url: null, esReferido: false };
  return { url, esReferido: propio?.esReferido ?? false };
}
