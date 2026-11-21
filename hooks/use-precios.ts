"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PrecioMercado, Precios } from "@/lib/plataforma/cartera-real/tipos";

/** Cada cuánto se pregunta de nuevo con la pestaña a la vista. El servidor cachea lo mismo. */
export const INTERVALO_MS = 60_000;

export interface EstadoPrecios {
  precios: Precios;
  mep: number | null;
  /** Cuándo llegó la última respuesta buena (ISO). */
  consultado: string | null;
  /** La última consulta falló: se siguen mostrando los precios anteriores. */
  error: boolean;
  cargando: boolean;
  recargar: () => void;
}

/**
 * Precios de mercado que se refrescan solos cada minuto, solo mientras la pestaña
 * está visible (no gastamos datos ni consultas con la pestaña en segundo plano).
 */
export function usePrecios(simbolos: string[]): EstadoPrecios {
  const clave = [...new Set(simbolos)].sort().join(",");
  const [estado, setEstado] = useState<Omit<EstadoPrecios, "recargar">>({
    precios: {},
    mep: null,
    consultado: null,
    error: false,
    cargando: true,
  });
  const enCurso = useRef<AbortController | null>(null);

  const consultar = useCallback(async () => {
    enCurso.current?.abort();
    const ctrl = new AbortController();
    enCurso.current = ctrl;
    try {
      const res = await fetch(`/api/precios?simbolos=${encodeURIComponent(clave)}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(String(res.status));
      const d = (await res.json()) as { precios: PrecioMercado[]; mep: { venta: number } | null; consultado: string };
      setEstado((prev) => ({
        // Lo que no llegó esta vez conserva el precio anterior.
        precios: { ...prev.precios, ...Object.fromEntries(d.precios.map((p) => [p.simbolo, p])) },
        mep: d.mep?.venta ?? prev.mep,
        consultado: d.consultado,
        error: false,
        cargando: false,
      }));
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setEstado((prev) => ({ ...prev, error: true, cargando: false }));
    }
  }, [clave]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const arrancar = () => {
      if (timer) clearInterval(timer);
      void consultar();
      timer = setInterval(() => void consultar(), INTERVALO_MS);
    };
    const parar = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const alCambiarVisibilidad = () => (document.visibilityState === "visible" ? arrancar() : parar());

    if (document.visibilityState === "visible") arrancar();
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () => {
      parar();
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      enCurso.current?.abort();
    };
  }, [consultar]);

  return { ...estado, recargar: consultar };
}
