// Puente cartera → comparador: qué posiciones de la cartera sugerida tienen
// alternativas en pesos para comparar, y a qué pestaña llevan.

import type { Categoria, Posicion } from "../tipos";

/** Pestaña del comparador para cada categoría comparable. */
export const PESTANA_POR_CATEGORIA: Partial<Record<Categoria, string>> = {
  // "Liquidez (FCI money market y cauciones)": billeteras + money market de rescate inmediato.
  liquidez: "billeteras",
  // Renta fija: plazo fijo, UVA y FCI de renta fija, todo junto.
  fija: "todo",
};

/**
 * Link al comparador con el monto de esa parte de la cartera. El monto va en USD
 * (`usd=`) porque el plan está en dólares; el comparador lo pasa a pesos con el
 * dólar MEP que obtiene en el servidor. null si la categoría no es comparable.
 */
export function hrefComparador(p: Pick<Posicion, "categoria" | "montoInicial">): string | null {
  const tab = PESTANA_POR_CATEGORIA[p.categoria];
  if (!tab) return null;
  const params = new URLSearchParams({ tab });
  if (Number.isFinite(p.montoInicial) && p.montoInicial > 0) params.set("usd", String(Math.round(p.montoInicial)));
  return `/comparador?${params.toString()}`;
}
