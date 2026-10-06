"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Plan } from "./tipos";

// Persistencia local (localStorage) del plan del usuario.
// Es temporal: cuando esté el login con Supabase, el plan pasa a guardarse en la
// base y este archivo queda como respaldo para quien todavía no tiene cuenta.

const CLAVE = "finup:plan:v1";
const EVENTO = "finup:plan-cambio";

function esPlan(x: unknown): x is Plan {
  const p = x as Plan | null;
  return !!p && p.version === 1 && !!p.respuestas && !!p.perfil && Array.isArray(p.posiciones);
}

function leerCrudo(): string | null {
  try {
    return window.localStorage.getItem(CLAVE);
  } catch {
    return null; // modo privado o storage bloqueado
  }
}

function parsear(crudo: string | null | undefined): Plan | null {
  if (!crudo) return null;
  try {
    const x = JSON.parse(crudo);
    return esPlan(x) ? x : null;
  } catch {
    return null;
  }
}

export function guardarPlan(plan: Plan): void {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(plan));
  } catch {
    /* sin storage: el plan vive solo en esta pestaña */
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function borrarPlan(): void {
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    /* nada que borrar */
  }
  window.dispatchEvent(new Event(EVENTO));
}

function suscribir(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENTO, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENTO, cb);
  };
}

// `cargando` es true hasta que el navegador leyó el storage (evita parpadeos y
// errores de hidratación: el servidor siempre renderiza el estado "cargando").
export function usePlan() {
  const crudo = useSyncExternalStore<string | null | undefined>(suscribir, leerCrudo, () => undefined);
  const plan = useMemo(() => parsear(crudo), [crudo]);
  const guardar = useCallback((p: Plan) => guardarPlan(p), []);
  const borrar = useCallback(() => borrarPlan(), []);
  return { plan, cargando: crudo === undefined, guardar, borrar };
}
