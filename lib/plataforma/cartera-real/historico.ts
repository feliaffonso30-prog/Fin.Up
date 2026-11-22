// Precio de un día pasado, para calcular lo que puso la persona a partir de la fecha en
// que compró. Puro: la serie llega de afuera (lib/mercado/historico.ts).

export interface Cierre {
  /** AAAA-MM-DD */
  fecha: string;
  cierre: number;
}

/** Cuántos días para atrás buscamos si ese día no hubo mercado (fin de semana, feriado). */
export const DIAS_HACIA_ATRAS = 10;

/**
 * El cierre del día pedido o, si no hubo mercado, el del último día anterior (hasta
 * DIAS_HACIA_ATRAS días antes). null si no hay datos tan cerca.
 */
export function cierreEnFecha(serie: readonly Cierre[], fecha: string): Cierre | null {
  const limite = restarDias(fecha, DIAS_HACIA_ATRAS);
  let mejor: Cierre | null = null;
  for (const c of serie) {
    if (!(c.cierre > 0) || c.fecha > fecha || c.fecha < limite) continue;
    if (!mejor || c.fecha > mejor.fecha) mejor = c;
  }
  return mejor;
}

export function restarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}
