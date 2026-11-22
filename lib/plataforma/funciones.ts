// Qué funciones son de pago. Todavía no hay cobro ni pantalla de planes (pasos 3 y 4
// de la hoja de ruta): mientras tanto las funciones Plus se ven en "vista previa",
// abiertas para todos y con la marca "Plus".
//
// Ojo: esto es solo para la interfaz. Cuando haya cobro, el control real va en el
// servidor (políticas RLS que miren `perfiles.plan`), no acá.

export type PlanUsuario = "free" | "plus";
export type Funcion = "cartera-real";

export const PLAN_DE_FUNCION: Record<Funcion, PlanUsuario> = {
  "cartera-real": "plus",
};

/** true mientras las funciones Plus están abiertas a todos para probarlas. */
export const VISTA_PREVIA_PLUS = true;

export function puedeUsar(funcion: Funcion, plan: PlanUsuario, vistaPrevia = VISTA_PREVIA_PLUS): boolean {
  if (vistaPrevia) return true;
  return PLAN_DE_FUNCION[funcion] === "free" || plan === "plus";
}

export const esPlus = (funcion: Funcion) => PLAN_DE_FUNCION[funcion] === "plus";
