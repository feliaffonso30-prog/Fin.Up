import type { ContextoEstrategia } from "@/lib/finbot/types";
import { analizar, armarPosiciones, calcularDistribucion, generarAvisos } from "./cartera";
import { definirPerfil, validarRespuestas } from "./perfil";
import { ANIOS_POR_HORIZONTE, serieProyeccion } from "./proyeccion";
import type { Plan, Respuestas } from "./tipos";

// Punto de entrada del motor: de las respuestas del onboarding al plan completo.
// Es una función pura (mismas respuestas, mismo plan), sin red ni IA, así que
// cada recomendación se puede explicar y auditar.
export function generarPlan(respuestas: Respuestas, generadoEn: string = new Date().toISOString()): Plan {
  const perfil = definirPerfil(respuestas);
  const distribucion = calcularDistribucion(perfil.perfil, respuestas);
  const posiciones = armarPosiciones(distribucion, perfil.perfil, respuestas);
  const analisis = analizar(distribucion);
  const anios = ANIOS_POR_HORIZONTE[respuestas.horizonte];

  return {
    version: 1,
    generadoEn,
    respuestas,
    perfil,
    posiciones,
    analisis,
    avisos: generarAvisos(perfil.perfil, distribucion, respuestas),
    anios,
    proyeccion: serieProyeccion(
      respuestas.capitalInicial,
      respuestas.aporteMensual,
      anios,
      analisis.retornoMin,
      analisis.retornoMax,
    ),
  };
}

// Un plan guardado lleva sus textos adentro (nombres, "qué puede salir mal"...). Al leerlo se
// vuelve a generar desde sus respuestas: como el motor es determinístico, da la misma cartera
// con los textos actuales. Si las respuestas no son válidas, se deja el plan como estaba.
export function actualizarPlan(plan: Plan): Plan {
  if (Object.keys(validarRespuestas(plan.respuestas)).length > 0) return plan;
  try {
    return generarPlan(plan.respuestas, plan.generadoEn);
  } catch {
    return plan;
  }
}

// Lo que FinBot necesita saber de la cartera del usuario (mismo formato que la demo).
export function aContextoEstrategia(plan: Plan): ContextoEstrategia {
  return {
    edad: String(plan.respuestas.edad),
    perfil: plan.perfil.perfil,
    objetivo: plan.respuestas.objetivo,
    distribucion: plan.posiciones.map((p) => ({ activo: p.nombre, porcentaje: p.porcentaje, tipo: p.categoria })),
    retornoMin: plan.analisis.retornoMin,
    retornoMax: plan.analisis.retornoMax,
    caida: plan.analisis.caida,
    nivelRiesgo: plan.analisis.nivelRiesgo,
  };
}
