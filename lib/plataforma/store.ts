"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { AUTH_CONFIGURADA } from "@/lib/supabase/config";
import { actualizarPlan } from "./plan";
import { archivarPlanRemoto, guardarPlanRemoto, haySesion, leerPlanVigente } from "./remoto";
import type { Plan } from "./tipos";
import { esPlan } from "./validar-plan";

// Dónde vive el plan del usuario:
// - Con sesión iniciada: en la tabla `planes_inversion`, atado a su cuenta, sin copia en el navegador.
// - Sin sesión (primero el plan, después la cuenta) o sin Supabase configurado: en localStorage,
//   solo en este navegador. Al crear la cuenta, ese plan se pasa a la tabla y se borra de acá.
// En todos los casos los componentes usan el mismo hook: `usePlan()`.

const CLAVE = "finup:plan:v1";
const EVENTO = "finup:plan-cambio";

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
    return esPlan(x) ? actualizarPlan(x) : null;
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

// ---- Modo sin cuenta (localStorage) --------------------------------------

// `cargando` es true hasta que el navegador leyó el storage (evita parpadeos y
// errores de hidratación: el servidor siempre renderiza el estado "cargando").
function usePlanLocal() {
  const crudo = useSyncExternalStore<string | null | undefined>(suscribir, leerCrudo, () => undefined);
  const plan = useMemo(() => parsear(crudo), [crudo]);
  const guardar = useCallback(async (p: Plan) => {
    guardarPlan(p);
    return true;
  }, []);
  const borrar = useCallback(async () => {
    borrarPlan();
    return true;
  }, []);
  const recargar = useCallback(() => {}, []);
  return { plan, cargando: crudo === undefined, error: null as string | null, sinCuenta: false, guardar, borrar, recargar };
}

// ---- Modo con cuenta (Supabase) -------------------------------------------

// sinCuenta: hay login disponible pero nadie inició sesión, así que el plan vive en este navegador.
type EstadoRemoto = { plan: Plan | null | undefined; error: string | null; sinCuenta: boolean };
let remoto: EstadoRemoto = { plan: undefined, error: null, sinCuenta: false }; // undefined = cargando
let cargaEnCurso = false;
const oyentes = new Set<() => void>();

function emitir(nuevo: EstadoRemoto) {
  remoto = nuevo;
  oyentes.forEach((f) => f());
}

/** Olvida lo cargado (al ingresar con otra cuenta). */
export function reiniciarPlanRemoto() {
  cargaEnCurso = false;
  emitir({ plan: undefined, error: null, sinCuenta: false });
}

async function cargarRemoto() {
  if (cargaEnCurso) return;
  cargaEnCurso = true;
  try {
    if (!(await haySesion())) {
      emitir({ plan: parsear(leerCrudo()), error: null, sinCuenta: true });
      return;
    }
    const guardado = await leerPlanVigente();
    let plan = guardado ? actualizarPlan(guardado) : null;
    if (!plan) {
      // Primera vez con cuenta: si armó un plan antes de registrarse, lo pasamos a su cuenta.
      const local = parsear(leerCrudo());
      if (local && (await guardarPlanRemoto(local))) {
        borrarPlan();
        plan = local;
      }
    }
    emitir({ plan, error: null, sinCuenta: false });
  } catch {
    emitir({ plan: null, error: "No pudimos cargar tu plan. Revisá tu conexión y probá de nuevo.", sinCuenta: false });
  } finally {
    cargaEnCurso = false;
  }
}

const suscribirRemoto = (cb: () => void) => {
  oyentes.add(cb);
  return () => {
    oyentes.delete(cb);
  };
};

function usePlanRemoto() {
  const estado = useSyncExternalStore<EstadoRemoto>(suscribirRemoto, () => remoto, () => remoto);
  useEffect(() => {
    if (remoto.plan === undefined) void cargarRemoto();
  }, []);

  const guardar = useCallback(async (p: Plan) => {
    if (!(await haySesion())) {
      guardarPlan(p);
      emitir({ plan: p, error: null, sinCuenta: true });
      return true;
    }
    const ok = await guardarPlanRemoto(p);
    if (ok) emitir({ plan: p, error: null, sinCuenta: false });
    return ok;
  }, []);
  const borrar = useCallback(async () => {
    if (!(await haySesion())) {
      borrarPlan();
      emitir({ plan: null, error: null, sinCuenta: true });
      return true;
    }
    const ok = await archivarPlanRemoto();
    if (ok) emitir({ plan: null, error: null, sinCuenta: false });
    return ok;
  }, []);
  const recargar = useCallback(() => {
    emitir({ plan: undefined, error: null, sinCuenta: false });
    void cargarRemoto();
  }, []);

  return { plan: estado.plan ?? null, cargando: estado.plan === undefined, error: estado.error, sinCuenta: estado.sinCuenta, guardar, borrar, recargar };
}

// AUTH_CONFIGURADA es una constante de compilación: siempre se usa el mismo hook.
export const usePlan = AUTH_CONFIGURADA ? usePlanRemoto : usePlanLocal;
