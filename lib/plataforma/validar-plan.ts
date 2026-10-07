import type { Plan } from "./tipos";

/** Comprueba que algo leído de afuera (localStorage o base) tenga la forma de un Plan. */
export function esPlan(x: unknown): x is Plan {
  const p = x as Plan | null;
  return !!p && p.version === 1 && !!p.respuestas && !!p.perfil && Array.isArray(p.posiciones);
}
