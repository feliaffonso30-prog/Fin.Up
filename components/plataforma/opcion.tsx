"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Opción seleccionable tipo "radio" para el cuestionario.
export function Opcion({
  seleccionada,
  onClick,
  titulo,
  detalle,
  children,
}: {
  seleccionada: boolean;
  onClick: () => void;
  titulo: string;
  detalle?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={seleccionada}
      onClick={onClick}
      className={cn(
        "flex min-h-14 w-full cursor-pointer items-start justify-between gap-3 rounded-lg px-4 py-3.5 text-left transition-[transform,background-color] duration-150 active:scale-[0.98] motion-reduce:active:scale-100",
        seleccionada ? "bloque-azul" : "vidrio text-foreground hover:bg-white/15",
      )}
    >
      <span className="min-w-0">
        <span className="block text-lg font-bold leading-snug">{titulo}</span>
        {detalle && <span className={cn("mt-0.5 block text-sm leading-snug", seleccionada ? "text-white" : "text-muted-foreground")}>{detalle}</span>}
        {children}
      </span>
      {seleccionada && <Check className="mt-1 h-5 w-5 shrink-0" aria-hidden />}
    </button>
  );
}

// `labelledBy` apunta a la pregunta visible; `etiqueta` queda como nombre de respaldo.
export function GrupoOpciones({
  etiqueta,
  labelledBy,
  describedBy,
  children,
}: {
  etiqueta?: string;
  labelledBy?: string;
  describedBy?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={labelledBy ? undefined : etiqueta}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className="space-y-2.5"
    >
      {children}
    </div>
  );
}
