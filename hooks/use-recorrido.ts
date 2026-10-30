"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { armarRecorrido, cantidadHechos, pasoActual, type IdPaso } from "@/lib/plataforma/recorrido";
import type { Plan } from "@/lib/plataforma/tipos";

// Avance del recorrido guiado: qué pasos ya hizo y si lo ocultó. Es una comodidad
// de este navegador (localStorage), no un dato de la cuenta: si se pierde, el
// recorrido vuelve a empezar y no pasa nada. Se reinicia al rehacer el perfil,
// porque está atado a la fecha del plan.

const CLAVE = "finup:recorrido:v1";

interface Guardado {
  plan: string; // generadoEn del plan al que corresponde
  hechos: IdPaso[];
  oculto: boolean;
}

function leer(): Guardado | null {
  try {
    const x = JSON.parse(window.localStorage.getItem(CLAVE) ?? "null");
    return x && typeof x.plan === "string" && Array.isArray(x.hechos) ? (x as Guardado) : null;
  } catch {
    return null;
  }
}

function escribir(g: Guardado) {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(g));
  } catch {
    /* sin storage: el avance vive solo mientras la pestaña esté abierta */
  }
}

export function useRecorrido(plan: Plan) {
  const pasos = useMemo(() => armarRecorrido(plan), [plan]);
  const vacio = useMemo<Guardado>(() => ({ plan: plan.generadoEn, hechos: [], oculto: false }), [plan.generadoEn]);
  const [estado, setEstado] = useState<Guardado>(vacio);
  // false hasta leer el storage: evita mostrar un paso que en realidad ya estaba hecho.
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const g = leer();
    setEstado(g && g.plan === plan.generadoEn ? g : vacio);
    setListo(true);
  }, [plan.generadoEn, vacio]);

  const actualizar = useCallback((cambio: (g: Guardado) => Guardado) => {
    setEstado((prev) => {
      const nuevo = cambio(prev);
      escribir(nuevo);
      return nuevo;
    });
  }, []);

  const marcar = useCallback(
    (id: IdPaso) => actualizar((g) => (g.hechos.includes(id) ? g : { ...g, hechos: [...g.hechos, id] })),
    [actualizar],
  );
  const setOculto = useCallback((oculto: boolean) => actualizar((g) => ({ ...g, oculto })), [actualizar]);

  return {
    pasos,
    hechos: estado.hechos,
    actual: pasoActual(pasos, estado.hechos),
    cantidad: cantidadHechos(pasos, estado.hechos),
    oculto: estado.oculto,
    listo,
    marcar,
    setOculto,
  };
}
