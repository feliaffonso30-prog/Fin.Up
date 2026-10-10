// Respaldo ante fallas de las APIs externas, sin depender de Next (testeable).
//
// Cada fuente devuelve siempre un `ResultadoFuente`: nunca tira error.
// - "ok": dato fresco (dentro del tiempo de revalidación, con margen).
// - "desactualizado": la API falló (o la caché no pudo renovarse) y mostramos
//   la última copia buena, con un aviso.
// - "error": no hay ningún dato para mostrar; la UI muestra un estado vacío.

export type EstadoFuente = "ok" | "desactualizado" | "error";

export interface ResultadoFuente<T> {
  datos: T;
  estado: EstadoFuente;
  actualizadoEn: string | null; // ISO de cuando se descargó el dato
  aviso?: string;
}

export interface Copia<T> {
  datos: T;
  actualizadoEn: string;
}

export const AVISO_DESACTUALIZADO =
  "No pudimos actualizar estos datos. Te mostramos los últimos que obtuvimos; pueden no reflejar las tasas de hoy.";
export const AVISO_SIN_DATOS = "Estos datos no están disponibles en este momento. Probá de nuevo en un rato.";

/**
 * Corre `obtener` (que ya pasa por la caché de Next) y decide qué mostrar.
 * - `ultimaBuena`: memoria del servidor con la última copia que funcionó.
 * - `edadMaximaMs`: más vieja que esto, la copia se marca como desactualizada
 *   (pasa cuando la caché sigue sirviendo un dato viejo porque la API no responde).
 */
export async function conRespaldo<T>(opciones: {
  clave: string;
  obtener: () => Promise<Copia<T>>;
  vacio: T;
  edadMaximaMs: number;
  ultimaBuena: Map<string, Copia<unknown>>;
  ahora?: number;
  registrarError?: (clave: string, error: unknown) => void;
}): Promise<ResultadoFuente<T>> {
  const { clave, obtener, vacio, edadMaximaMs, ultimaBuena, registrarError } = opciones;
  const ahora = opciones.ahora ?? Date.now();

  try {
    const copia = await obtener();
    ultimaBuena.set(clave, copia);
    const edad = ahora - Date.parse(copia.actualizadoEn);
    if (Number.isFinite(edad) && edad > edadMaximaMs) {
      return { ...copia, estado: "desactualizado", aviso: AVISO_DESACTUALIZADO };
    }
    return { ...copia, estado: "ok" };
  } catch (error) {
    registrarError?.(clave, error);
    const previa = ultimaBuena.get(clave) as Copia<T> | undefined;
    if (previa) return { ...previa, estado: "desactualizado", aviso: AVISO_DESACTUALIZADO };
    return { datos: vacio, estado: "error", actualizadoEn: null, aviso: AVISO_SIN_DATOS };
  }
}
