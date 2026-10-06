// Límite simple de mensajes por visitante (por IP), en memoria.
// Alcanza para la demo: protege la cuota gratuita de Gemini de un uso abusivo.
// Limitación: en Vercel cada instancia del servidor tiene su propio contador y
// se reinicia cuando la instancia se apaga. Para algo estricto en producción,
// mover esto a un store compartido (ej. Upstash Redis).

const LIMITE = 15; // mensajes por ventana
const VENTANA_MS = 60 * 60 * 1000; // 1 hora

const registros = new Map<string, number[]>();

export function ipDe(req: Request): string {
  // Vercel pone la IP real del visitante primera en x-forwarded-for
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

export function consumir(clave: string): { permitido: boolean; minutosParaReintentar: number } {
  const ahora = Date.now();
  const recientes = (registros.get(clave) ?? []).filter((t) => ahora - t < VENTANA_MS);

  if (recientes.length >= LIMITE) {
    registros.set(clave, recientes);
    return { permitido: false, minutosParaReintentar: Math.ceil((recientes[0] + VENTANA_MS - ahora) / 60000) };
  }

  recientes.push(ahora);
  registros.set(clave, recientes);

  // Limpieza ocasional para que el mapa no crezca indefinidamente
  if (registros.size > 5000) {
    for (const [k, ts] of registros) if (ahora - ts[ts.length - 1] >= VENTANA_MS) registros.delete(k);
  }
  return { permitido: true, minutosParaReintentar: 0 };
}
