"use client";

import { useEffect, useState } from "react";

/** La cotización del dólar MEP (venta), para mostrar montos en pesos. `null` mientras llega o si no está disponible. */
export function useDolarMep(): number | null {
  const [mep, setMep] = useState<number | null>(null);

  useEffect(() => {
    let vigente = true;
    fetch("/api/dolar-mep")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (vigente && typeof d?.venta === "number" && d.venta > 0) setMep(d.venta);
      })
      .catch(() => {
        /* sin cotización: no se ofrece ver en pesos */
      });
    return () => {
      vigente = false;
    };
  }, []);

  return mep;
}
