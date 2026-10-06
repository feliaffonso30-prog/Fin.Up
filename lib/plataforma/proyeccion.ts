import type { Horizonte, PuntoProyeccion } from "./tipos";

// Años que usamos para proyectar según el plazo que eligió el usuario.
export const ANIOS_POR_HORIZONTE: Record<Horizonte, number> = {
  "menos-2": 1,
  "2-5": 3,
  "5-10": 7,
  "mas-10": 15,
};

// Valor futuro con aporte mensual e interés compuesto mensual.
// Usamos la tasa mensual equivalente, para que en 12 meses rinda exactamente la tasa anual.
export function proyectar(inicial: number, aporteMensual: number, anios: number, tasaAnualPct: number): number {
  const meses = Math.round(anios * 12);
  const r = Math.pow(1 + tasaAnualPct / 100, 1 / 12) - 1;
  if (r === 0) return inicial + aporteMensual * meses;
  const f = Math.pow(1 + r, meses);
  return inicial * f + aporteMensual * ((f - 1) / r);
}

// Una fila por año (del 1 al último) con el total aportado y el rango bajo/alto.
export function serieProyeccion(
  inicial: number,
  aporteMensual: number,
  anios: number,
  tasaMinPct: number,
  tasaMaxPct: number,
): PuntoProyeccion[] {
  const serie: PuntoProyeccion[] = [];
  for (let anio = 1; anio <= anios; anio++) {
    serie.push({
      anio,
      aportado: Math.round(inicial + aporteMensual * anio * 12),
      bajo: Math.round(proyectar(inicial, aporteMensual, anio, tasaMinPct)),
      alto: Math.round(proyectar(inicial, aporteMensual, anio, tasaMaxPct)),
    });
  }
  return serie;
}
