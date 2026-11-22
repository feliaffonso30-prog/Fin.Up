"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PrecioMercado, Precios } from "@/lib/plataforma/cartera-real/tipos";

/** Cada cuánto se pregunta de nuevo con la pestaña a la vista. El servidor cachea lo mismo. */
export const INTERVALO_MS = 60_000;
/** Símbolos por pedido (el máximo que acepta /api/precios). */
const TANDA = 20;

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
      // La ruta acepta hasta 20 símbolos por pedido: si hay más, se piden en tandas.
      const todos = clave ? clave.split(",") : [];
      const tandas = todos.length === 0 ? [""] : Array.from({ length: Math.ceil(todos.length / TANDA) }, (_, i) => todos.slice(i * TANDA, (i + 1) * TANDA).join(","));
      const respuestas = await Promise.all(
        tandas.map(async (t) => {
          const res = await fetch(`/api/precios?simbolos=${encodeURIComponent(t)}`, { signal: ctrl.signal });
          if (!res.ok) throw new Error(String(res.status));
          return (await res.json()) as { precios: PrecioMercado[]; mep: { venta: number } | null; consultado: string };
        }),
      );
      const nuevos = respuestas.flatMap((d) => d.precios);
      const ultima = respuestas[respuestas.length - 1];
      setEstado((prev) => ({
        // Lo que no llegó esta vez conserva el precio anterior.
        precios: { ...prev.precios, ...Object.fromEntries(nuevos.map((p) => [p.simbolo, p])) },
        mep: respuestas.find((d) => d.mep)?.mep?.venta ?? prev.mep,
        consultado: ultima.consultado,
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

    // La primera consulta va siempre (aunque la pestaña esté de fondo, para no quedar
    // "cargando"); lo que espera a que esté visible es la actualización de cada minuto.
    if (document.visibilityState === "visible") arrancar();
    else void consultar();
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () => {
      parar();
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      enCurso.current?.abort();
    };
  }, [consultar]);

  return { ...estado, recargar: consultar };
}
