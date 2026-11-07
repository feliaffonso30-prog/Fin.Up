import { generarPlan } from "./plan";
import type { Analisis, Respuestas } from "./tipos";

// Qué podría pasar en un año, en plata: lo bueno y lo malo se calculan juntos
// para que siempre se muestren juntos. Son los supuestos ilustrativos de cartera.ts.

export interface Escenarios {
  ganaMin: number;
  ganaMax: number;
  /** Cuánto cambia en un mal año (negativo). */
  pierde: number;
  /** Con cuánto quedarías después de un mal año. */
  queda: number;
}

export function calcularEscenarios(capital: number, analisis: Analisis): Escenarios {
  const pierde = (capital * analisis.caida) / 100;
  return {
    ganaMin: (capital * analisis.retornoMin) / 100,
    ganaMax: (capital * analisis.retornoMax) / 100,
    pierde,
    queda: capital + pierde,
  };
}

/** La persona de ejemplo de la portada: arranca con USD 1.000 y perfil conservador. */
export const RESPUESTAS_EJEMPLO: Respuestas = {
  edad: 24,
  objetivo: "Crecimiento",
  horizonte: "2-5",
  capitalInicial: 1000,
  aporteMensual: 50,
  fondoEmergencia: "parcial",
  deudasCaras: true,
  reaccionCaida: "vendo-parte",
  prioridad: "equilibrio",
  conocimiento: "basico",
};

/** Sale del mismo motor que los planes reales: las cifras de la portada nunca quedan viejas. */
export function ejemploDePortada() {
  const plan = generarPlan(RESPUESTAS_EJEMPLO, "2026-01-01T00:00:00.000Z");
  return { capital: RESPUESTAS_EJEMPLO.capitalInicial, analisis: plan.analisis };
}

/** Pasa un monto en pesos a dólares enteros con la cotización dada. */
export function pesosADolares(pesos: number, cotizacion: number): number {
  return Math.round(pesos / cotizacion);
}
