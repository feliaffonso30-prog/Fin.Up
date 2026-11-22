"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { simbolosPrecio } from "@/lib/plataforma/cartera-real/activos";
import { fotoDeHoy, MAX_FOTOS, reconstruirEvolucion, registrarFoto, type FotoDia, type PuntoEvolucion } from "@/lib/plataforma/cartera-real/evolucion";
import type { Cierre } from "@/lib/plataforma/cartera-real/historico";
import type { Tenencia, Valuacion } from "@/lib/plataforma/cartera-real/tipos";

const TANDA = 20;

/**
 * "Desde que compraste": pide los cierres diarios desde la primera compra y reconstruye
 * cuánto valía todo cada día. Los cierres pasados no cambian: se piden una vez.
 */
export function useEvolucionHistorica(tenencias: Tenencia[], hoy: string): { puntos: PuntoEvolucion[]; cargando: boolean; error: boolean } {
  const desde = tenencias.reduce((m, t) => (t.fecha < m ? t.fecha : m), hoy);
  const clave = [...new Set(tenencias.flatMap((t) => simbolosPrecio(t)))].sort().join(",");
  const [datos, setDatos] = useState<{ clave: string; series: Record<string, Cierre[]>; mep: Cierre[] } | null>(null);
  const [error, setError] = useState(false);
  const pedido = `${desde}|${clave}`;

  useEffect(() => {
    if (tenencias.length === 0) return;
    const ctrl = new AbortController();
    const todos = clave ? clave.split(",") : [];
    const tandas = todos.length === 0 ? [""] : Array.from({ length: Math.ceil(todos.length / TANDA) }, (_, i) => todos.slice(i * TANDA, (i + 1) * TANDA).join(","));
    setError(false);
    Promise.all(
      tandas.map(async (t) => {
        const r = await fetch(`/api/precios/serie?desde=${desde}&simbolos=${encodeURIComponent(t)}`, { signal: ctrl.signal });
        if (!r.ok) throw new Error(String(r.status));
        return (await r.json()) as { series: Record<string, Cierre[]>; mep: Cierre[] };
      }),
    )
      .then((rs) => setDatos({ clave: pedido, series: Object.assign({}, ...rs.map((r) => r.series)), mep: rs[0]?.mep ?? [] }))
      .catch(() => {
        if (!ctrl.signal.aborted) setError(true);
      });
    return () => ctrl.abort();
    // `pedido` resume desde + símbolos: con eso alcanza para saber si hay que volver a pedir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido]);

  const puntos = useMemo(
    () => (datos ? reconstruirEvolucion(tenencias, datos.series, datos.mep, hoy) : []),
    [datos, tenencias, hoy],
  );
  return { puntos, cargando: !error && datos?.clave !== pedido, error };
}

// ---------- "Desde que usás FinUp": una foto por día en este navegador ----------

const CLAVE_FOTOS = "finup:cartera-real:fotos:v1";
const EVENTO_FOTOS = "finup:cartera-real-fotos";

function leerFotos(): string | null {
  try {
    return window.localStorage.getItem(CLAVE_FOTOS);
  } catch {
    return null;
  }
}

function parsearFotos(crudo: string | null | undefined): FotoDia[] {
  if (!crudo) return [];
  try {
    const x: unknown = JSON.parse(crudo);
    if (!Array.isArray(x)) return [];
    return x
      .filter(
        (f): f is FotoDia =>
          !!f &&
          typeof f === "object" &&
          typeof (f as FotoDia).fecha === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test((f as FotoDia).fecha) &&
          ["valorArs", "valorUsd", "costoArs", "costoUsd"].every((k) => Number.isFinite((f as unknown as Record<string, number>)[k])),
      )
      .slice(-MAX_FOTOS);
  } catch {
    return [];
  }
}

function suscribirFotos(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENTO_FOTOS, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENTO_FOTOS, cb);
  };
}

/** Lee las fotos guardadas y guarda la de hoy cada vez que cambia el total (solo si está completo). */
export function useFotosDiarias(v: Valuacion, hoy: string): FotoDia[] {
  const crudo = useSyncExternalStore<string | null | undefined>(suscribirFotos, leerFotos, () => undefined);
  const fotos = useMemo(() => parsearFotos(crudo), [crudo]);
  const foto = fotoDeHoy(v, hoy);
  const firma = foto ? `${Math.round(foto.valorArs)}|${Math.round(foto.costoArs)}` : null;

  useEffect(() => {
    if (!foto) return;
    const actual = parsearFotos(leerFotos()).find((f) => f.fecha === hoy);
    if (actual && `${Math.round(actual.valorArs)}|${Math.round(actual.costoArs)}` === firma) return;
    try {
      window.localStorage.setItem(CLAVE_FOTOS, JSON.stringify(registrarFoto(parsearFotos(leerFotos()), foto)));
    } catch {
      /* sin storage: el gráfico de "desde que usás FinUp" queda vacío */
    }
    window.dispatchEvent(new Event(EVENTO_FOTOS));
    // Se vuelve a guardar solo si cambió el valor del día.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma, hoy]);

  return fotos;
}
