"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { tenenciaSchema, type Tenencia } from "@/lib/plataforma/cartera-real/tipos";

// Dónde vive "Lo que tenés": por ahora solo en este navegador (localStorage), con el
// mismo patrón que el plan. La tabla en Supabase (`movimientos_cartera`, con RLS) está
// propuesta pero todavía no aplicada: cuando exista, este hook elige según la sesión.

const CLAVE = "finup:cartera-real:v1";
const EVENTO = "finup:cartera-real-cambio";

function leerCrudo(): string | null {
  try {
    return window.localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

/** Valida ítem por ítem: si uno quedó mal guardado, se descarta sin perder el resto. */
function parsear(crudo: string | null | undefined): Tenencia[] {
  if (!crudo) return [];
  try {
    const x: unknown = JSON.parse(crudo);
    if (!Array.isArray(x)) return [];
    return x.flatMap((item) => {
      const r = tenenciaSchema.safeParse(item);
      return r.success ? [r.data] : [];
    });
  } catch {
    return [];
  }
}

function escribir(lista: Tenencia[]) {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    /* sin storage: queda solo en esta pestaña hasta recargar */
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

export function useCarteraReal() {
  const crudo = useSyncExternalStore<string | null | undefined>(suscribir, leerCrudo, () => undefined);
  const tenencias = useMemo(() => parsear(crudo), [crudo]);

  const agregar = useCallback((t: Tenencia) => escribir([...parsear(leerCrudo()), t]), []);
  const actualizar = useCallback(
    (t: Tenencia) => escribir(parsear(leerCrudo()).map((x) => (x.id === t.id ? t : x))),
    [],
  );
  const quitar = useCallback((id: string) => escribir(parsear(leerCrudo()).filter((x) => x.id !== id)), []);

  return { tenencias, cargando: crudo === undefined, agregar, actualizar, quitar };
}
