"use client";

import { cn } from "@/lib/utils";

/** En qué se muestran las cifras del plan: porcentaje, pesos o dólares. */
export type Unidad = "pct" | "ars" | "usd";

const ETIQUETA: Record<Unidad, string> = { pct: "%", ars: "Pesos", usd: "Dólares" };
const NOMBRE: Record<Unidad, string> = { pct: "porcentaje", ars: "pesos", usd: "dólares" };

type Props = {
  valor: Unidad;
  /** Las unidades disponibles: sin monto cargado solo hay porcentaje; sin cotización no hay pesos. */
  opciones: Unidad[];
  onCambiar: (u: Unidad) => void;
  className?: string;
};

/** Selector de unidad. No es el botón principal de la pantalla: la opción elegida va en vidrio, no en blanco. */
export function SelectorUnidad({ valor, opciones, onCambiar, className }: Props) {
  if (opciones.length < 2) return null;
  return (
    <div role="group" aria-label="Ver las cifras en" className={cn("vidrio inline-flex shrink-0 rounded-full p-1", className)}>
      {opciones.map((u) => (
        <button
          key={u}
          type="button"
          aria-pressed={valor === u}
          aria-label={`Ver en ${NOMBRE[u]}`}
          onClick={() => onCambiar(u)}
          className={cn(
            "min-h-9 rounded-full px-3.5 text-sm transition-transform duration-150 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
            valor === u ? "bg-white/20 font-extrabold text-foreground" : "font-medium text-muted-foreground hover:text-foreground",
          )}
        >
          {ETIQUETA[u]}
        </button>
      ))}
    </div>
  );
}
